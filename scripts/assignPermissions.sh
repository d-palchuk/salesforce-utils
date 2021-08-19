set -e

echo "🐱 Let's assign necessary permisions to your user!"

PS_ONE=Permission_Set_One
PS_TWO=Permission_Set_Two

echo '🐱 Enter a username on whom you want to assign permissions ( skip if you wanna assign them to your user )'

read USER_NAME

for permset in $PS_ONE $PS_TWO

    do

        echo "🐱 Do you want to assign the $permset ? (y/n)"

        read answer

        if [ "$answer" == 'y' ]
            then
                echo "🐱 Assigning $permset permission please wait..."

                if [ -n "$USER_NAME" ]
                    then
                        sfdx force:user:permset:assign -n $permset -u $USER_NAME
                    else
                        sfdx force:user:permset:assign -n $permset
                fi
        fi

done

echo "🐱 Permissions successfully assigned!"

exit 0;