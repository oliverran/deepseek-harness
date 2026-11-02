# 005 Panel

Open **Superagent** in the DeepSeek Harness Web sidebar to supervise the agent. The panel prioritizes work that needs a person, then system health and history. This document builds on [000 Philosophy](000-philosophy.md) through [004 Prompts](004-prompts.md).

## Three questions

Opening the panel answers three questions, in this order:

1. Does anything need me now?
2. Is the system healthy and doing the right things?
3. What is the history of one piece of work, from Trigger through Eval to Ticket?

## Tabs

The top navigation follows user goals: **Workspace (工作台)**, **Tasks (任务)**, **Activity (消息与记录)** and **Settings (设置)**. Existing record links and saved routes continue to work.

| Tab | Shows |
| --- | --- |
| Workspace | Current repository, work needing attention, system problems, activity counts and worker load, with links to details |
| Tasks | Open, needs attention, working, waiting for a new message and ended task filters; pause automation remains available with confirmation |
| Activity | Discussions & messages, Admission decisions, and Connections & filtering. Discussions default to all threads so completed work remains discoverable |
| Settings | Accounts & repository, Task admission, Execution & delivery, and Advanced. Advanced contains Runtime & deployment and Full prompts |

**New task (发起任务)** opens a guide and links to the configured repository's GitHub Issue creation form, with an `@agent /task` prefix and acceptance-criteria template. The user fills and publishes the Issue on GitHub. This does not create local tasks or post automatically. Follow-ups can use the same prefix in the original Issue's comments; configured admission and source rules still apply.

Task details show the latest report and related PR links when recorded. These are progress and references, not proof that a PR was merged or that the task succeeded. Authorization details are folded; retry, stop, input delivery and original discussion links remain available. Waiting for a new trigger remains distinct from task completion.

### Reading individual records

A dropped message links to its Ticket, or to its Thread when it has no Ticket. The Source page explains whether its conversation disappeared or the Source stopped listening to it.

A human follow-up still owned by an Executor is marked **Delivered to Ticket**, without an Eval. The Thread also shows hand-back reasons and context-only Subscriptions. **Evaluate again** can send that follow-up to Eval, or retry a Trigger with no effective judgement: one filtered by its Source, an unavailable Eval, or a delivered message with neither a non-stop Decision nor an Executor acknowledgement.

Ticket details show the originating Trigger, Decision and reason, scope and Policy version. Assignments and secondary details are folded below the immediate actions. **Retry** is available for failed Input delivery or a Ticket waiting for a person after a blocked or failed Report. Ended Tickets show outcomes such as **Pull request merged** or **Stopped by a person**.

## Settings groups

- **Sources:** one card per Source with its switch, fields and verified account facts. GitHub also offers receive-all switches for new Issues, pull requests, comments and default-branch CI. Polling and read limits are under Advanced.
- **Eval:** the Policy version and rules, followed by **On each Source** and the Eval settings. Each Source tab contains its allowed list, membership sync, admission table and bot list. Sync runs at startup and on **Sync now**. The admission table distinguishes receiving scope, sender membership and whether the message addresses the agent. Eval settings select the accept mode, timeout and assessment model.
- **Execution:** worker model, concurrency, directory root, prepare command and blocked commands. Clicking an available variable inserts it into the prepare command.
- **Prompts:** **Edit** changes team sections, built-in parts and skills. **Full prompt** shows the assembled text and compares it with saved text or defaults. **History** lists versions. Edited built-in parts are marked changed and can be reset; templates list their required placeholders.

  An upgrade that changes an overridden default marks it **Default updated** (默认内容已更新). The panel compares the old and new defaults above the team's text. If the old default was not recorded, it compares the team's text with the new default instead. Choose **Keep my text** or **Use the new default**. Overrides for removed parts are listed below the tab bar and dropped on the next save.
- **Deployment:** startup problems with **Check again**, the state directory and machine limits. Saved limits apply without restart. The DeepSeek Harness Plugin Manager exposes the same page.

## Whale-girl companion

The whale-girl companion now runs only as the small native macOS desktop app. The browser no longer registers a character overlay or collapsed whale launcher, so reopening the sidebar cannot restore a second character. Open `DSH.app` in the project root to start or reuse the local DSH service, open its authenticated console and show the desktop companion. The menu-bar whale controls visibility, size, rest, service startup and quit. Quitting the companion leaves the background DSH service running. Logging out or restarting the Mac requires opening the app again; it is not installed as a login item.

The companion reads Superagent worker load and health, not every ordinary Harness chat. A brief celebration after a worker round does not certify a PR as successful. Feeding/resting does not call a model, send a GitHub message or pause work. See `desktop-pet/README.md` for operation details and `assets/whale-pet-ATTRIBUTION.md` for the generated sprite's separate noncommercial share-alike artwork license.

## Search

The header search finds Triggers by text, id, Feishu message id or a stored link, such as a GitHub comment URL. A Feishu link missing from the original message becomes searchable only after the host reads it during the current process lifetime.

Search also finds Threads by references such as `#12` or a GitHub URL, and Tickets by title or a matching Thread.

## Principles

1. **Focus on what matters.** Every element answers one of the three questions, or it is removed. A number appears only when it changes what the supervisor does.
2. **Precise definitions.** Categories have checkable definitions, are mutually exclusive and cover every case, as the Ticket stages do. A label says whom a row waits for and what it needs, not an internal status code.
3. **One place per concept.** Source state belongs in Source; Threads and Triggers in Trigger; Decisions in Eval; Tickets in Execution. Settings are grouped by the concept they configure. Overview summarizes these pages and links to them instead of becoming another detailed view.
4. **Domain structure.** The panel uses the domain terms. Internal identifiers appear only in folded details, and names replace identifiers where they can be resolved.
5. **Honest state.** A count equals the length of the list it links to, and no state contradicts another fact.
6. **Quiet by default.** Healthy states take no extra space. Problems must be actionable; a one-off network error is not enough. Rows needing a person offer their action directly. Keep page explanations to one sentence and put further detail in the (?) tooltip. Destructive actions require confirmation.
7. **Consistent controls.** Use DeepSeek Harness design tokens and control behavior. The same information should look the same throughout the panel. Each settings block has one save bar, visible only while changes exist, a save runs or a save fails.
