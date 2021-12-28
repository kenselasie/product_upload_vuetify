import  ReconnectingWebSocket from '../../js/reconnecting-websocket'
export default {
    data() {
        return {
            connection: null,
            socketData: null
        }
    },
    methods: {
        initWebSocketConnection(current) {
            console.log("Starting connection to WebSocket Server");
            this.connection = new ReconnectingWebSocket(
                "https://acme.symliq.com/workflow/webhook?action=bulk_upload_done",
                null,
                { debug: true, reconnectInterval: 10000 }
            );
            this.connection.onmessage = function (event) {
                const data = JSON.parse(event.data);
                current.socketData = data.message;
                    
                if (data.message == "__pong__") {
                    console.log("Pong recieved");
                } else {
                    console.log(data.message);
                }
            };
            this.connection.onopen = function (event) {
                console.log(event);
                //current.connection.send("message")
                console.log("Successfully connected to the echo websocket server...");
            };
            this.connection.onclose = function (event) {
                console.log(event);
                console.log("the socket closed ");
            };
            this.connection.onerror = function (error) {
                console.log("Error Occured: ");
                console.log(error)
            };
        }
    },
    created() {
        this.initWebSocketConnection(this);
    },
}