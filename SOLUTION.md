# CSRF fix and custom configuration findings

The server uses csrf-csrf 4.x for signed double-submit-cookie protection. An
HMAC binds the CSRF token to the verified JWT session. Each new login/register
JWT includes a random jti so logging in twice within one second still produces
different sessions. A separate CSRF_SECRET is recommended; JWT_SECRET is used
as a fallback for compatibility with the original environment configuration.

GET /api/csrf-token requires authentication, returns { csrfToken }, sets an
HttpOnly CSRF cookie, and disables caching. The client fetches this token before
each write and returns it in x-csrf-token. Concurrent writes share a token fetch.
The server never accepts the cookie alone as the request token.

All /api writes require authentication and CSRF validation, including item/user
changes and logout. GET, HEAD and OPTIONS are exempt; POST login/register are
explicitly exempt because there is no existing session. Missing, mismatched,
tampered and other-session tokens must return 403 before data changes.

CORS does not prevent a normal HTML form POST; preventing response reads does
not undo writes. HttpOnly prevents cookie reads, not automatic cookie sending.
The demonstration's localhost ports are different origins but the same site,
so SameSite=Lax does not prevent its form request. The CSRF token supplies the
additional value that the attack page cannot obtain from the API response.

## Dialog source to report to your TA

- .vscode/tasks.json originally ran five Node scripts on folderOpen, with task
  output hidden. It now has no automatic tasks.
- .vscode/setupJestConfig.js uses setInterval(displayMessage, 30000) to invoke
  dialog.info every 30 seconds.
- .vscode/setupCI.js invokes an initial dialog and writes AGENTS.md/CLAUDE.md
  containing instructions intended to redirect AI assistants.
- .vscode/dialog/index.js launches osascript on macOS (zenity on Linux or
  cscript with msgbox.vbs on Windows) to display native dialogs.
- .vscode/settings.json hid .vscode and the generated instruction files. Those
  exclusions have been removed so the relevant files are visible.

The original setup scripts are retained as evidence; do not run them. The tests
were extracted as text into tests/server and tests/client, and Jest/Babel
configuration is now present directly. VS Code startup scripts are unnecessary.
Disabling tasks does not terminate any script already running in a terminal.

## Running and validation

From the project root, without inline shell comments:

```sh
npm install
npm test
npm run dev
```

Keep server/.env with the existing MongoDB and JWT settings; optionally add a
separate randomly generated CSRF_SECRET. server/.env.example is a template.
The first test run may download an in-memory MongoDB binary.

Follow Flow.md: register/login, save a recovery email in Settings, start the
attacker server separately, and open http://localhost:1337 in the same browser.
Its POST should now return 403; refreshing Settings must show the original
recovery email. Verify a legitimate Settings save still succeeds and logout works.
The attacker folder has separate dependencies and is not a root npm workspace.

Validation completed:

- The four original assignment tests pass across both server and client suites
  (`npm test -- --runInBand`). Additional tests were removed as requested.
- The user confirmed the browser attack returns 403 and the recovery email
  remains unchanged after refreshing Settings.
- Legitimate recovery-email updates work.
