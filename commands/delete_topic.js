'use strict';

let DOT_WAITING_TIME = 200;

let cli = require('heroku-cli-util');
let co = require('co');
let HerokuKafkaClusters = require('./clusters.js').HerokuKafkaClusters;
let sleep = require('co-sleep');
let prompt = require('co-prompt');

function* printWaitingDots() {
  yield sleep(DOT_WAITING_TIME);
  process.stdout.write('.');
  yield sleep(DOT_WAITING_TIME);
  process.stdout.write('.');
  yield sleep(DOT_WAITING_TIME);
  process.stdout.write('.');
}

function* doDeletion(context, heroku) {
  var deletion = new HerokuKafkaClusters(heroku, process.env, context).deleteTopic(context.args.CLUSTER, context.args.TOPIC);
  process.stdout.write(`Deleting topic ${context.args.TOPIC}`);
  yield printWaitingDots();

  var err = yield deletion;
  if (err) {
    process.stdout.write("\n");
    cli.error(err);
    process.exit(1);
  } else {
    process.stdout.write(' done.\n');
    console.log("Your topic has been marked for deletion, and will be removed from the cluster shortly");
    process.exit(0);
  }
}

function* deleteTopic (context, heroku) {
  if (context.flags.confirm !== context.args.TOPIC) {
    console.log(`
 !    WARNING: Destructive Action
 !    This command will affect the cluster: ${context.args.CLUSTER}
 !
 !    To proceed, type "${context.args.TOPIC}" or re-run this command with --confirm ${context.args.TOPIC}

`);
    var confirm = yield prompt('> ');
    if (confirm === context.args.TOPIC) {
      yield doDeletion(context, heroku);
    } else {
      console.log(` !    Confirmation did not match ${context.args.TOPIC}. Aborted.`);
      process.exit(1);
    }
  } else {
    yield doDeletion(context, heroku);
  }
}

module.exports = {
  topic: 'kafka',
  command: 'delete',
  description: 'deletes a topic in kafka',
  help: `
    Deletes a topic in Kafka.
    Note that topics are deleted asynchronously, so even though this command has returned,
    a topic may still exist.

    Examples:

    $ heroku kafka:delete page-visits
    $ heroku kafka:delete HEROKU_KAFKA_BROWN_URL page-visits
`,
  needsApp: true,
  needsAuth: true,
  args: [
    {
      name: 'TOPIC',
      optional: false
    },
    {
      name: 'CLUSTER',
      optional: true
    }
  ],
  run: cli.command(co.wrap(deleteTopic))
};
