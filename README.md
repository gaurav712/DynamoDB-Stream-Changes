# DynamoDB-Stream-Changes

## Lambdas used in AWS

#### `connect`: to override the default behaviour on connection to a websocket
```python
import json
import boto3

client = boto3.client('dynamodb')

def lambda_handler(event, context):
    
    # Add the incoming connection id to WebSocketManager
    data = client.put_item(
        TableName = 'WebSocketManager',
        Item = {
            'ConnectionId': {'S': event['requestContext']['connectionId']}
        }
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
```


#### `disconnect`: similarly for disconnect
```python
import json
import boto3

client = boto3.client('dynamodb')

def lambda_handler(event, context):
    
    client.delete_item(
        TableName = 'WebSocketManager',
        Key = {'ConnectionId': {'S': event['requestContext']['connectionId']}}
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
```


#### `handle-record-update`: triggered when DB is changed; streams the changes over the websocket
```python
import json
import boto3

db = boto3.resource('dynamodb')
table = db.Table('WebSocketManager')

apigatewaymanagementapi = boto3.client(
    'apigatewaymanagementapi',
    endpoint_url = 'BROADCAST_ADDRESS_FOR_THE_SOCKET'
)

def lambda_handler(event, context):
    
    # records = event['Records']
    # eventName = records[0]['eventName']
    
    # # Return if it's not a modification or insertion operation
    # if eventName != 'MODIFY' and eventName != 'INSERT':
    #     return {}
    
    # Get the update fields
    # name = records[0]['dynamodb']['NewImage']['name']['S']
    # zip = records[0]['dynamodb']['NewImage']['zip']['N']
        
    # Get the existing connection ids
    connections = table.scan()
    for connection in connections['Items']:
        connectionId = connection['ConnectionId']
        apigatewaymanagementapi.post_to_connection(
            # Data = name + "|" + zip,
            Data = 'changed',
            ConnectionId = connectionId
        )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
```
