# Visual Reasoning Study — cognitive-trap battery

A self-contained, GitHub Pages-compatible demonstration containing all seven
tasks from the [Cognitive Trap Repository](https://github.com/FelipeMAffonso/cognitive-trap-repository).

## What it includes

- Seven visual-reasoning items in randomized order
- Randomized multiple-choice order
- Response-time and accuracy recording
- Local CSV and JSON export
- Optional JSON submission endpoint and completion redirect
- Responsive, keyboard-accessible interface
- Neutral study introduction and a post-study debrief

The browser scores answers against salted SHA-256 digests. This avoids placing
a plain-text answer key in the source, but it is not secure against a determined
client-side inspection. A static GitHub Pages deployment cannot securely keep
secrets or collect results by itself.

## Preview locally

Serve this directory with any static server. From the workspace root:

```powershell
python -m http.server 8000 --directory experiments/tasks/cognitive-trap-battery
```

Then open `http://localhost:8000`.

An optional participant identifier can be supplied as `?pid=YOUR_ID`.

## Publish with GitHub Pages

1. Create an empty GitHub repository.
2. Copy the contents of this directory to the repository root.
3. Push to the repository's default branch.
4. In GitHub, open **Settings → Pages** and choose **Deploy from a branch**.
5. Select the default branch and `/ (root)`, then save.

No build step or dependencies are required.

## Optional data collection

Edit `config.js`:

```js
window.EXPERIMENT_CONFIG = {
  studyId: "my-study-id",
  dataEndpoint: "https://example.org/api/responses",
  completionUrl: "https://example.org/complete",
  showDownloadButtons: true,
  shuffleTasks: true,
  shuffleChoices: true
};
```

`dataEndpoint` must accept an HTTPS `POST` with a JSON body and permit the
GitHub Pages origin through CORS. Do not put API keys or other secrets in this
repository.

## Research-use note

The introduction does not disclose the automation-screening hypothesis before
the tasks because doing so would alter the measurement. The completion screen
contains a debrief. Real participant research should use approved consent and
debrief language, a preregistered scoring rule, appropriate privacy controls,
and ethics/IRB review. The seven-item score should not be treated as a reliable
individual human-versus-automation classification by itself.

## Attribution and license

Stimuli and task wording are adapted from:

> Affonso, Felipe M. (2026), “Brief Commentary: A Framework for Detecting AI
> Agents in Online Research,” *Journal of Consumer Research*.
> https://doi.org/10.1093/jcr/ucag006

The source materials are licensed under CC BY 4.0. See `LICENSE`.
