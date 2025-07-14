const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable not set");
}

const JwtPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});
type JwtPayload = z.infer<typeof JwtPayloadSchema>;

export interface AuthContext extends HandlerContext {
  user: {
    id: string;
    email: string;
  };
}

export type AuthHandler = (event: HandlerEvent, context: AuthContext) => Promise<HandlerResponse>;

export const authMiddleware = (handler: AuthHandler): Handler => {
  return async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
    const unauthorized = {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
    try {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return unauthorized;
      }
      const token = authHeader.split(" ")[1];
      let payload: JwtPayload;
      try {
        const verifyOptions: VerifyOptions = { algorithms: ["HS256"] };
        if (JWT_ISSUER) verifyOptions.issuer = JWT_ISSUER;
        if (JWT_AUDIENCE) verifyOptions.audience = JWT_AUDIENCE;
        const decoded = jwt.verify(token, JWT_SECRET, verifyOptions);
        payload = JwtPayloadSchema.parse(decoded);
      } catch (err) {
        console.error("JWT verification failed:", err);
        return unauthorized;
      }
      const res = await client.query("SELECT id, email FROM users WHERE id = $1", [payload.userId]);
      if (!res.rows.length) {
        return unauthorized;
      }
      const user = res.rows[0];
      const authContext: AuthContext = {
        ...context,
        user: { id: user.id, email: user.email },
      };
      return handler(event, authContext);
    } catch (err) {
      console.error("Auth middleware error:", err);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }
  };
};