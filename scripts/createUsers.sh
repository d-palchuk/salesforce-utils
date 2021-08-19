set -e

echo "🐱 Let's create a couple of sample users!"

ADMIN='config/admin-def.json'
USER='config/user-def.json'

echo '🐱 Enter a username or alias for the target org ( skip if you wanna use the default org )'

read USER_NAME

for userDef in $USER $ADMIN

    do

        echo '🐱 Enter an unique username for' $userDef

        read username

        echo "🐱 Creating user from definition file: $userDef please wait..."

        if [ -n "$USER_NAME" ]
            then
                sfdx force:user:create username=$username -f $userDef -u $USER_NAME
            else
                sfdx force:user:create username=$username -f $userDef
        fi

done

echo "🐱 Users successfully created!"

exit 0;