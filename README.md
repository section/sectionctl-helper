# sectionctl-helper

This is a package that helps with the setup of a nodejs package that is going to be deployed on section.io's edge compute platform.

cd into the package that you want to deploy, then use this script.

Usage:

```
  $ sectionctl-helper static [build-dir] [options]
 Options
    --account, -a    Section.io account ID
    --app, -i    Section.io application ID
 Examples
      $ npx sectionctl-static-deps build/ -a 1887 -i 7749
```

Example:

```
npx "@section.io/sectionctl-helper" static build/ --account 0001 --app 0001
```

## Development of this script

to test the script in development, run `npm run test` and observe the contents of the `test/` folder.
