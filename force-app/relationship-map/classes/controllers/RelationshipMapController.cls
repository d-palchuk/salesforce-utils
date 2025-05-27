public with sharing class RelationshipMapController {

    @AuraEnabled
    public static Object getData(String relationshipMapConfigurationName, Id recordId){
        try {
            RelationshipMapConfiguration__c relationshipMapConfiguration = getRelationshipMapConfiguration(relationshipMapConfigurationName);
            RelationshipMapNode__c rootRelationshipMapNode = getRelationshipMapNode(relationshipMapConfiguration.RelationshipMapNode__c);
            String query = getQuery(rootRelationshipMapNode, recordId);
            
            List<SObject> records = Database.query(query);
            if (records.isEmpty()) {
                throw new AuraHandledException('No root record found for the given ID.');
            }

            Object data = buildRelationshipMapData(rootRelationshipMapNode, records[0]);
            
            return data;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static String getQuery(RelationshipMapNode__c rootRelationshipMapNode, Id recordId) {
        QueryBuilder rootQueryBuilder = new QueryBuilder()
            .addFrom(rootRelationshipMapNode.ObjectName__c)
            .addFieldSet(rootRelationshipMapNode.ObjectName__c, rootRelationshipMapNode.FieldSetName__c)
            .addConditions()
            .add(new QueryBuilder.CompareCondition('Id').eq(recordId))
            .endConditions();

        for (RelationshipMapNodeGroup__c nodeGroup : rootRelationshipMapNode.RelationshipMapNodeGroups__r) {
            for (RelationshipMapNode__c node : nodeGroup.RelationshipMapNodes__r) {
                QueryBuilder nodeQueryBuilder = new QueryBuilder();
                nodeQueryBuilder.addFrom(node.ParentNodeRelationshipFieldName__c);
                nodeQueryBuilder.addFieldSet(node.ObjectName__c, node.FieldSetName__c);

                for (RelationshipMapNodeGroup__c childNodeGoup : node.RelationshipMapNodeGroups__r) {
                    for (RelationshipMapNode__c childNode : childNodeGoup.RelationshipMapNodes__r) {
                        QueryBuilder childNodeQueryBuilder = new QueryBuilder();
                        childNodeQueryBuilder.addFrom(childNode.ParentNodeRelationshipFieldName__c);
                        childNodeQueryBuilder.addFieldSet(childNode.ObjectName__c, childNode.FieldSetName__c);

                        for (RelationshipMapNodeGroup__c subChildNodeGroup : childNode.RelationshipMapNodeGroups__r) {
                            for (RelationshipMapNode__c subChildNode : subChildNodeGroup.RelationshipMapNodes__r) {
                                QueryBuilder subChildNodeQueryBuilder = new QueryBuilder();
                                subChildNodeQueryBuilder.addFrom(subChildNode.ParentNodeRelationshipFieldName__c);
                                subChildNodeQueryBuilder.addFieldSet(subChildNode.ObjectName__c, subChildNode.FieldSetName__c);
                                
                                childNodeQueryBuilder.addSubQuery(subChildNodeQueryBuilder);
                            }   
                        }
                        nodeQueryBuilder.addSubQuery(childNodeQueryBuilder);
                    }
                }
                rootQueryBuilder.addSubQuery(nodeQueryBuilder);
            }
        }

        return rootQueryBuilder.toString().normalizeSpace();
    }

    private static Object buildRelationshipMapData(RelationshipMapNode__c rootRelationshipMapNode, SObject record) {
        RelationshipMapNode rootMapNode = new RelationshipMapNode();
        rootMapNode.id = record.Id;
        rootMapNode.data = getTopLevelFieldsMap(record);
        rootMapNode.children = new List<RelationshipMapNode>();

        for (RelationshipMapNodeGroup__c nodeGroup : rootRelationshipMapNode.RelationshipMapNodeGroups__r) {
            RelationshipMapNode nodeGroupMapNode = new RelationshipMapNode();
            nodeGroupMapNode.id = nodeGroup.Id;
            nodeGroupMapNode.data = getTopLevelFieldsMap(nodeGroup);
            nodeGroupMapNode.children = new List<RelationshipMapNode>();

            for (RelationshipMapNode__c node : nodeGroup.RelationshipMapNodes__r) {
                List<SObject> nodeRecords = record.getSObjects(node.ParentNodeRelationshipFieldName__c);
                if (nodeRecords == null) {
                    continue;
                }
                for (SObject nodeRecord : nodeRecords) {
                    RelationshipMapNode nodeRecordMapNode = new RelationshipMapNode();
                    nodeRecordMapNode.id = nodeRecord.Id;
                    nodeRecordMapNode.data = getTopLevelFieldsMap(nodeRecord);
                    nodeRecordMapNode.children = new List<RelationshipMapNode>();

                    for (RelationshipMapNodeGroup__c subNodeGroup : node.RelationshipMapNodeGroups__r) {
                        RelationshipMapNode subNodeGroupMapNode = new RelationshipMapNode();
                        subNodeGroupMapNode.id = subNodeGroup.Id + nodeRecordMapNode.id;
                        subNodeGroupMapNode.data = getTopLevelFieldsMap(subNodeGroup);
                        subNodeGroupMapNode.children = new List<RelationshipMapNode>();

                        for (RelationshipMapNode__c subNode : subNodeGroup.RelationshipMapNodes__r) {
                            List<SObject> subNodeRecords = nodeRecord.getSObjects(subNode.ParentNodeRelationshipFieldName__c);
                            if (subNodeRecords == null) {
                                continue;
                            }
                            for (SObject subNodeRecord : subNodeRecords) {
                                RelationshipMapNode subNodeRecordMapNode = new RelationshipMapNode();
                                subNodeRecordMapNode.id = subNodeRecord.Id;
                                subNodeRecordMapNode.data = getTopLevelFieldsMap(subNodeRecord);
                                subNodeRecordMapNode.children = new List<RelationshipMapNode>();

                                subNodeGroupMapNode.children.add(subNodeRecordMapNode);
                            }
                        }

                        if (!subNodeGroupMapNode.children.isEmpty()) {
                            nodeRecordMapNode.children.add(subNodeGroupMapNode);
                        }
                    }

                    nodeGroupMapNode.children.add(nodeRecordMapNode);
                }
            }

            if(!nodeGroupMapNode.children.isEmpty()) {
                rootMapNode.children.add(nodeGroupMapNode);
            }
            
        }

        return rootMapNode;
    }

    private static Map<String, Object> getTopLevelFieldsMap(SObject record) {
        Map<String, Object> topLevelFieldMap = new Map<String, Object>();
        Map<String, Object> populatedFieldsMap = record.getPopulatedFieldsAsMap();
        Map<String, Schema.SObjectField> fieldsMap = record.Id.getSobjectType().getDescribe().fields.getMap();
        
        for (String key : populatedFieldsMap.keySet()) {
            Object value = populatedFieldsMap.get(key);
            Boolean isTopLevelField = !((value instanceOf List<Object>));
            if (isTopLevelField) {
                Boolean isChildToParentField = populatedFieldsMap.get(key) instanceOf SObject;
                if (isChildToParentField) {
                    topLevelFieldMap.put(key, getTopLevelFieldsMap((SObject) populatedFieldsMap.get(key)));
                } else {
                    String fieldLabel = fieldsMap.get(key).getDescribe().label;
                    String fieldType = fieldsMap.get(key).getDescribe().getType().toString();
                    topLevelFieldMap.put(key, new Map<String, Object> {
                        'name' => key, 
                        'label' => fieldLabel, 
                        'value' => value,
                        'type' => fieldType
                    });
                }
                
            }
        }
        Object objectNameInfo = getObjectNameInfo(record);
        Object objectIconInfo = getObjectIconInfo(record);
        topLevelFieldMap.put('nodeObjectName', objectNameInfo);
        topLevelFieldMap.put('nodeObjectIcon', objectIconInfo);

        return topLevelFieldMap;
    }

    private static Map<String, String> getObjectNameInfo(SObject record) {
        return new Map<String, String> {
            'objectName' => record.Id.getSObjectType().getDescribe().getName(),
            'objectLabel' => record.Id.getSObjectType().getDescribe().getLabel()
        };
    }

    private static Map<String, String> getObjectIconInfo(SObject record) {
        String sObjectName = record.Id.getSObjectType().getDescribe().getName();
        Map<String, String> result = new Map<String, String>();
        List<Schema.DescribeTabSetResult> tabSetDescribeResults = Schema.describeTabs();
        List<Schema.DescribeTabResult> describeTabResults = new List<Schema.DescribeTabResult>();

        for (Schema.DescribeTabSetResult tabSetDescribeResult : tabSetDescribeResults) {
            describeTabResults.addAll(tabSetDescribeResult.getTabs());
        }

        for(Schema.DescribeTabResult describeTabResult : describeTabResults) {
            if( sObjectName == describeTabResult.getSobjectName() ) {
                List<Schema.DescribeIconResult> describeIconResults = describeTabResult.getIcons();
                for (Schema.DescribeIconResult describeIconResult : describeIconResults) {
                    if (describeIconResult.getTheme() == 'theme4' && describeIconResult.getWidth() == 60) {
                        result.put('iconUrl', describeIconResult.getUrl());
                        break;
                    }
                }

                List<Schema.DescribeColorResult> describeColorResults = describeTabResult.getColors();
                for (Schema.DescribeColorResult describeColorResult : describeColorResults) {
                    if (describeColorResult.getTheme() == 'theme4') {
                        result.put('iconColor', describeColorResult.getColor());
                        break;
                    }
                }
            }
        }

        if (!result.containsKey('iconUrl')) {
            result.put('iconUrl', URL.getOrgDomainURL().toExternalForm() + '/img/icon/t4v35/standard/default_60.png');
            result.put('iconColor', '808080');
        }
      
        return result;
    }

    private static RelationshipMapConfiguration__c getRelationshipMapConfiguration(String relationshipMapConfigurationName) {
        List<RelationshipMapConfiguration__c> relationshipMapConfigurations = [
            SELECT Id, Name, RelationshipMapNode__c
            FROM RelationshipMapConfiguration__c
            WHERE Name = :relationshipMapConfigurationName
        ];

        if (relationshipMapConfigurations.isEmpty()) {
            throw new AuraHandledException('No Relationship Map Configuration found for the given ID.');
        }

        return relationshipMapConfigurations[0];
    }

    private static RelationshipMapNode__c getRelationshipMapNode(Id relationshipMapNodeId) {
        List<RelationshipMapNode__c> relationshipMapNodes = [
            SELECT Id, Name, ObjectName__c, FieldSetName__c, ParentNodeRelationshipFieldName__c, ParentRelationshipMapNodeGroup__c, (
                SELECT Id, Name, Color__c, (
                    SELECT Id, Name, ObjectName__c, FieldSetName__c, ParentNodeRelationshipFieldName__c, ParentRelationshipMapNodeGroup__c, (
                        SELECT Id, Name, Color__c, (
                            SELECT Id, Name, ObjectName__c, FieldSetName__c, ParentNodeRelationshipFieldName__c, ParentRelationshipMapNodeGroup__c
                            FROM RelationshipMapNodes__r
                        )
                        FROM RelationshipMapNodeGroups__r
                    )
                    FROM RelationshipMapNodes__r
                )
                FROM RelationshipMapNodeGroups__r
            )
            FROM RelationshipMapNode__c
            WHERE Id = :relationshipMapNodeId
        ];

        if (relationshipMapNodes.isEmpty()) {
            throw new AuraHandledException('No Relationship Map Node found for the given ID.');
        }

        return relationshipMapNodes[0];
    }

    @TestVisible
    private class RelationshipMapNode {
        @AuraEnabled
        public String id;
        @AuraEnabled
        public Map<String, Object> data;
        @AuraEnabled
        public List<RelationshipMapNode> children;
    }

}