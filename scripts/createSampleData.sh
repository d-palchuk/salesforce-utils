set -e

echo "🐱 Let's create a couple of sample data!"

PATH_TO_DATA="config/sample-data"
PATH_WITH_PREFIX="/with-prefix/"
PATH_WITHOUT_PREFIX="/without-prefix/"

STAND_DELIVER_JSON="Stand_Deliver__c.json"
CRITERIA_JSON="Assessment_Criteria__c.json"
RUBRIC_JSON="Assessment_Rubric__c.json"


echo "🐱 Do you need sample data with prefix?  (y/n)"

read answer

if [ "$answer" == 'y' ]
    then
        PATH_TO_DATA+=$PATH_WITH_PREFIX
    else
        PATH_TO_DATA+=$PATH_WITHOUT_PREFIX
fi

for json in $STAND_DELIVER_JSON $CRITERIA_JSON $RUBRIC_JSON

    do
        echo "🐱 Do you want import records from $json?  (y/n)"

        read answer

        if [ "$answer" == 'y' ]
            then
                echo "🐱 Importing" $json "please wait..."

                sfdx force:data:tree:import -f $PATH_TO_DATA$json
        fi

done

echo "🐱 You've successfully created sample data!"

exit 0;