# Contributing

## Add or change a loop

A loop is one folder, `plugin/parts/harness/loops/<id>/`, with its card, `card.md`, and an image if it has one. The
plugin and the site both read the card, so it is the only place a loop is described.

The format and the steps are in [plugin/parts/harness/loops/FORMAT.md](plugin/parts/harness/loops/FORMAT.md): copy
the template, fill it in, then run

```bash
python3 plugin/parts/harness/scripts/catalog.py index   # adds the loop to loops/index.yaml and the README's list
python3 plugin/parts/harness/scripts/catalog.py check   # validates every card; needs PyYAML
```

CI runs the same check on every pull request. Every change under `plugin/` needs the owner's review
(`.github/CODEOWNERS`).
