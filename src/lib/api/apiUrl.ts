const DEVELOPMENT_API_URL = "http://localhost:3001";

// API_URL wins when set. On Render, the Blueprint fills API_HOSTPORT instead:
// the API's private-network "host:port" (fromService hostport), known only
// after the API is created and without a scheme. Private-network traffic is
// plain HTTP. Empty values count as unset because the Dockerfile turns a
// missing build arg into an empty variable.
export function resolveApiUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.API_URL) {
    return env.API_URL;
  }
  if (env.API_HOSTPORT) {
    return `http://${env.API_HOSTPORT}`;
  }
  return DEVELOPMENT_API_URL;
}
