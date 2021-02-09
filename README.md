# sectionctl-helper

This is a package that helps with the setup of a nodejs package that is going to be deployed on section.io's edge compute platform.

cd into the package that you want to deploy, then use this script.

Usage:

```
  static:
 Usage
   $ sectionctl-helper static [build-dir] [options]
 Options
    --account, -a    Section.io account ID
    --app, -i    Section.io application ID
    Examples
     # With NPX
      $ npx "@section.io/sectionctl-helper" static build/ -a 1234 -i 5678
     # Or with it installed in your node_modules
      $ sectionctl-helper static build/ -a 1234 -i 5678

  help:
    Usage
      $ npx "@section.io/sectionctl-helper" help
```

Example (in this case it's a create-react-app, which uses the path `build/` to compile production builds to.)

```
npx "@section.io/sectionctl-helper" static build/ -a 1234 -i 5678
```

## Development of this script

to test the script in development, `cd test` then `npm run test` and observe the contents of the `test/` folder.

## Publishing

```
git add .
git commit -m "my commit"
# an interactive terminal GUI will pop when you run the release script
npm run release
```
