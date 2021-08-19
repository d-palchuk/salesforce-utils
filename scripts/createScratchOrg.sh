set -e

echo "🐱 Let's create the scratch org!"


ORG_DEF='config/project-scratch-def.json'

echo '🐱 Enter the scratch org alias'

read ORG_ALIAS

echo '🐱 Enter the duration of the scratch org, in days. Valid values are from 1 to 30'

read ORG_DURATION

echo "🐱 Creating $ORG_ALIAS scratch please wait..."

sfdx force:org:create -f $ORG_DEF -a $ORG_ALIAS -d $ORG_DURATION -w 10 -s

sh scripts/installDependencies.sh
sh scripts/createUsers.sh
sh scripts/assignPermissions.sh

echo "🐱 You've created the new one scratch org! It was set as default scratch org."