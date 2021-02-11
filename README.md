# sectionctl-helper

This is a package that helps with the setup of a nodejs package that is going to be deployed on section.io's edge compute platform.

cd into the package that you want to deploy, then use this script.

Usage:

```
  static:
    Description
        This will install express.js and add scripts to run express and deploy your app.
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
  scripts:
    Description:
        If you don't want to use express (ie if your app uses its own node.js webserver runtime), you can use this command to just add the scripts to your package.json.
      Usage
        $ sectionctl-helper scripts [options]
      Options
      --account, -a    Section.io account ID
      --app, -i    Section.io application ID
      Examples
       # With NPX
        $ npx "@section.io/sectionctl-helper" scripts -a 1234 -i 5678
       # Or with it installed in your node_modules
        $ sectionctl-helper scripts -a 1234 -i 5678

  help:
    Usage
      $ npx "@section.io/sectionctl-helper" help
```

Example (in this case it's a create-react-app, which uses the path `build/` to compile production builds to.)

```
npx "@section.io/sectionctl-helper" static build/ --account 1234 --app 5678
```

For non-static apps that use their own node.js webserver runtime in production, ie: next.js, use the following:

```
npx "@section.io/sectionctl-helper" scripts --account 1234 --app 5678
```

## Development of this script

to test the script in development, `cd test` then `npm run test:static` or `npm run test:scripts` and observe the contents of the `test/` folder.

## Publishing

```
git add .
git commit -m "my commit"
# an interactive terminal GUI will pop when you run the release script
npm run release
```
