# Project workflow

This workspace is connected to https://github.com/Thomas1255/sumi-e-style-landing-page.git.
The user wants project work committed as it progresses, including work in other chats using this workspace.

## Layout and validation

- Run commands from the repository root. The application lives in `stillwater/`.
- `stillwater/dist/` contains the maintained, deployable site source and artwork. Keep these files tracked.
- Run `npm run dev` to preview the site and `npm run build` to validate changes.
- Preserve artwork, reference studies, and prompt records. Deployment archives, local QA captures, dependencies, and secrets do not belong in commits.
- Keep all user-supplied reference files and raw attachments local, under ignored `.local/private-references/` when a workspace copy is needed. Do not commit, push, deploy, or upload them to external services. Generated artwork and approved runtime assets remain tracked.

## Git workflow

- Inspect `git status` before editing; other chats may share this checkout.
- Make a descriptive commit after each completed, coherent project change. Run the relevant checks before committing and report any check that could not be completed.
- Stage only the files or hunks belonging to the current task. Preserve unrelated or unfinished changes from other chats.
- Push completed commits to `origin` on the current branch unless the user asks to keep them local. Use `main` for this existing checkout unless the task calls for another branch.
- Preserve existing history. Do not force-push, rewrite published commits, or discard another chat's work.
- If the remote has advanced, fetch and inspect the new commits before integrating them. Resolve straightforward conflicts within the task's scope; ask for direction when competing changes require a product decision.
- Include the commit hash and push status in the final update.
