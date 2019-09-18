## Contributing

### Where do I go from here?

If you've noticed a bug, search the github [issue tracker][] and check if someone else has already created a ticket. Otherwise, go ahead and [create a new one][new issue]!

### Fork & Create a Branch

If this is something you can fix, then [fork Masterdata-Importer][] and
create a branch with a suitable name.

``` bash
git checkout -b feature-or-bug-with-name
```

### Run

Start the example setup by using the `docker-compose.yml` as following:

``` bash
docker-compose up --build
```

### Found any bug?

* **Ensure the bug was not already reported** by [searching all issues][].

* If no other issue exists, [start with a new one][new issue]. Include a 
  **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

### Make a Pull Request

Afterwards, switch back to your master branch and make sure it's
up to date with Masterdata-Importer's master branch:

``` bash
git remote add upstream git@github.com:winner-potential/masterdata-importer.git
git checkout master
git pull upstream master
```

Update your feature or bug branch from your local copy of master, and push it.

``` bash
git checkout feature-or-bug-with-name
git rebase master
git push --set-upstream origin feature-or-bug-with-name
```

Finally, go to GitHub and [make your Pull Request][]