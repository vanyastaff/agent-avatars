# Agent theater 0.6.0 publication

The user authorized publication and `claude plugin update`. The marketplace is
`agent-avatars`, sourced from https://github.com/vanyastaff/agent-avatars.git.
The repository uses main directly, with no existing tags or GitHub releases.
Remote main matched local HEAD 4b69582 before publication. The installed user
plugin was 0.5.0.

Use the existing Git publication path: commit the reviewed implementation,
tests, previews and documentation; push main without force; refresh only the
agent-avatars marketplace; update only agent-avatars@agent-avatars at user scope.
A GitHub release would add an unused mechanism, while a local plugin-dir launch
would not update the installed marketplace copy requested by the user.

Readiness: 38 native tests and strict plugin validation passed. Static production
SVG previews were inspected. Actual application animation remains unverified.

Risk is limited to users updating this plugin. Keep the previous commit as the
rollback reference: revert the release commit and publish a newer patch version
if needed, then refresh and update the same marketplace. Never force-push main
or overwrite user plugin configuration. Restart/reload instructions follow the
installed CLI output; do not restart the user's application automatically.

Publication and installation results will be recorded after executing the steps.
