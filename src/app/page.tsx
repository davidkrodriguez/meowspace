import { APP_NAME } from "../constants";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>{APP_NAME}</h1>
      <p>
        API routes live under <code>/api/*</code>. Send{" "}
        <code>x-clerk-user-id</code> on mutating requests.
      </p>
    </main>
  );
}
