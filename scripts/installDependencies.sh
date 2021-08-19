#!/bin/bash


# The execution of this script stops if a command or pipeline has an error.

# For example, failure to install a dependent package will cause the script

# to stop execution.

set -e

echo "🐱 Let's install all the required dependencies!"


# Specify a package version id (starts with 04t)

# If you know the package alias but not the id, use force:package:version:list to find it.

PACKAGE_ONE=04t....
PACKAGE_TWO=04t....


# Specify the user name of the subscriber org.

echo '🐱 Enter a username or alias for the target org ( skip if you wanna use the default org )'

read USER_NAME


# Specify the timeout in minutes for package installation.

WAIT_TIME=20

# Then loop through the ids to install each of the dependent packages.

echo "🐱 The package you are installing depends on these packages (in correct dependency order): "

for id in $PACKAGE_ONE $PACKAGE_TWO

    do

        echo "🐱 Installing dependent package: "$id

        if [ -n "$USER_NAME" ]
            then
                sfdx force:package:install --package $id -u $USER_NAME -w $WAIT_TIME --publishwait 10
            else
                sfdx force:package:install --package $id -w $WAIT_TIME --publishwait 10
        fi

done

echo "🐱 Dependencies successfully installed!"


# After processing the dependencies, proceed to push the source.

if [ -n "$USER_NAME" ]
    then
        echo "🐱 Starting SFDX: Push Source to the org: "$USER_NAME

        sfdx force:source:push -u $USER_NAME --loglevel fatal

    else
        echo "🐱 Starting SFDX: Push Source to Default Scratch Org..."

        sfdx force:source:push --loglevel fatal
fi

echo "🐱 Metadata successfully pushed!"

exit 0;