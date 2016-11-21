all: clean node_modules test changelog

node_modules:
	npm install

test:
	./node_modules/karma/bin/karma start karma.conf.js --single-run

# git-changelog uses the most recent tag, which is not what we want after we
# just tagged a release. Use the previous tag instead.
IS_TAGGED_COMMIT:=$(shell git describe --exact-match HEAD > /dev/null && echo 1 || echo 0)
ifeq ($(IS_TAGGED_COMMIT), 1)
	TAG=$(shell git tag --sort=version:refname | tail -n2 | head -1)
	TAG_ARG:=-t $(TAG)
else
  TAG_ARG:=
endif

changelog: node_modules
	node_modules/git-changelog/tasks/command.js $(TAG_ARG)

clean:
	rm -rf node_modules coverage coverage-lcov Changelog.md
	npm cache clean
