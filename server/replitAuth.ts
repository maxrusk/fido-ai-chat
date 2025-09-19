import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Set default domain for development if not provided
if (!process.env.REPLIT_DOMAINS) {
  console.warn("REPLIT_DOMAINS not set, using development domain");
  process.env.REPLIT_DOMAINS = process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'fido-business-plan-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  let config;
  try {
    config = await getOidcConfig();
  } catch (error) {
    console.warn("Failed to get OIDC config, authentication may not work in development:", error);
    // Continue without auth config for development
    return;
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Clear any existing session before starting auth
    req.logout(() => {
      // In development, use the first available domain strategy
      const hostname = process.env.NODE_ENV === 'development' 
        ? process.env.REPLIT_DOMAINS!.split(",")[0] 
        : req.hostname;
      
      console.log(`OAuth login for hostname: ${hostname}`);
      
      passport.authenticate(`replitauth:${hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });
  });

  app.get("/api/callback", (req, res, next) => {
    // In development, use the first available domain strategy
    const hostname = process.env.NODE_ENV === 'development' 
      ? process.env.REPLIT_DOMAINS!.split(",")[0] 
      : req.hostname;
    
    console.log(`OAuth callback for hostname: ${hostname}`);
    console.log(`Available strategies: ${process.env.REPLIT_DOMAINS}`);
    
    passport.authenticate(`replitauth:${hostname}`, {
      successRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, (err: any) => {
      if (err) {
        console.error('OAuth callback error:', err);
        // Clear any stale session data
        req.logout(() => {
          // Redirect to login with a fresh start
          res.redirect("/api/login");
        });
        return;
      }
      next();
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // Development mode bypass
  if (process.env.NODE_ENV === 'development' && user && user.claims && user.claims.sub) {
    return next();
  }

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const refreshConfig = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(refreshConfig, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Admin-only authorization middleware
export const isAdmin: RequestHandler = async (req, res, next) => {
  // First check if user is authenticated
  isAuthenticated(req, res, (err: any) => {
    if (err || res.headersSent) return;
    
    const user = req.user as any;
    
    // Get the admin user ID from environment variable
    const adminUserId = process.env.ADMIN_USER_ID;
    
    if (!adminUserId) {
      console.warn("ADMIN_USER_ID not set - analytics access denied");
      return res.status(403).json({ message: "Access denied - Admin privileges required" });
    }
    
    // Check if the current user is the admin
    const currentUserId = user?.claims?.sub;
    
    if (currentUserId !== adminUserId) {
      console.log(`Access denied for user ${currentUserId} - admin required`);
      return res.status(403).json({ message: "Access denied - Admin privileges required" });
    }
    
    // User is admin, allow access
    next();
  });
};