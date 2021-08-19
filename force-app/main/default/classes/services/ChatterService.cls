public with sharing class ChatterService {

    public static FeedItem createFeedItem(Id parentId, String body, String linkURL, String linkTitle) {
        FeedItem result = new FeedItem();

        result.ParentId = parentId;
        result.Body     = body;
        result.Title    = linkTitle;
        result.LinkUrl  = linkURL;

        return result;
    }

    public static ConnectApi.FeedItemInput createFeedItemInput(Id subjectId, String message, String linkURL, String linkTitle) {
        ConnectApi.FeedItemInput result = new ConnectApi.FeedItemInput();
        ConnectApi.MessageBodyInput messageInput = new ConnectApi.MessageBodyInput();

        messageInput.messageSegments = new List<ConnectApi.MessageSegmentInput>();

        ConnectApi.MentionSegmentInput mentionSegment = new ConnectApi.MentionSegmentInput();

        mentionSegment.id = subjectId;

        messageInput.messageSegments.add(mentionSegment);

        if (message != null) {
            ConnectApi.TextSegmentInput textSegment = new ConnectApi.TextSegmentInput();

            textSegment.text = '\n\n' + message;

            messageInput.messageSegments.add(textSegment);
        }

        if (linkURL != null) {
            ConnectApi.LinkCapabilityInput linkInput = new ConnectApi.LinkCapabilityInput();

            linkInput.url     = linkURL;
            linkInput.urlName = linkTitle;

            ConnectApi.FeedElementCapabilitiesInput feedElementCapabilitiesInput      = new ConnectApi.FeedElementCapabilitiesInput();

            feedElementCapabilitiesInput.link = linkInput;
            result.capabilities               = feedElementCapabilitiesInput;
        }

        result.subjectId       = subjectId;
        result.body            = messageInput;
        result.feedElementType = ConnectApi.FeedElementType.FeedItem;

        return result;
    }

    public static void postFeedItemInputs(List<ConnectApi.FeedItemInput> feedItemInputs) {
        postFeedItemInputs(null, feedItemInputs);
    }
    public static void postFeedItemInputs(Id communityId, List<ConnectApi.FeedItemInput> feedItemInputs) {
        List<ConnectApi.BatchInput> result = new List<ConnectApi.BatchInput>();

        for (ConnectApi.FeedItemInput feedItemInput : feedItemInputs) {
            result.add(new ConnectApi.BatchInput(feedItemInput));
        }

        ConnectApi.ChatterFeeds.postFeedElementBatch(communityId, result);
    }
}
