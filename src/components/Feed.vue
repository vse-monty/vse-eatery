<template>
  <div class="main-content">

        <v-btn
        @click="runScript()"
        color="primary"
        icon>
        <v-icon>mdi-arrow-right-bold</v-icon>
        </v-btn>
       
        <v-btn
        @click="connectTo()"
        color="primary"
        icon>
        <v-icon>mdi-arrow-up-bold</v-icon>
        </v-btn>
       
        <v-btn
        @click="startServer()"
        color="primary"
        icon>
        <v-icon>mdi-arrow-left-bold</v-icon>
        </v-btn>

    <v-container grid-list-md text-xs-center>
    <v-layout column wrap>
      <v-flex v-for="order in orders" :key="order">

        <!-- <v-item> -->
          <v-card
            color="primary"
            dark
            class="align-center">
            <v-card-text class="px-0">order: {{order}}</v-card-text>
          </v-card>
        <!-- </v-item> -->

      </v-flex>
    </v-layout>
  </v-container>
  </div>
</template>

<script>
import io from 'socket.io-client'

export default {
  data: ()=> ({
    orders: [   '118104',
                '118105',
                '118106',
                '118115'],

    csi: null,
    socketIO: null,

  }),
  computed: {
    app() {
      return this.$root.$children[0];
    },
  },
  mounted() {
    this.app.home = this;
    this.csi = this.$root.$children[0].csInterface;
 
    console.log('demonty starting mounted function');

    this.socketIO = io('http://localhost:9574', {
      autoConnect: true,
    });


    this.csi.addEventListener('document.variables', (event) => {
        console.log('received message from ILST');
        console.log('event type: ' + event.type);
        if(event.data.length == 0){
          console.log('no data received. file either has no variables, or is corrupted.');
          return;
        }
        console.log('data: ->');
        console.log(event.data);

        this.socketIO.emit('give.variables', JSON.stringify({type: event.type, data: event.data}));
      });

    this.socketIO.on('get.variables', (data) => {
      console.log('calling OpenWorkingFile')
      console.log(data)
      this.csi.evalScript(`OpenWorkingFile('${encodeURI(data)}')`)
      this.csi.evalScript("getOpenDocumentVariables()");
      });

      console.log('demonty ended mounted function');
  },
  methods: {
    connectTo(){
      console.log('attempting to connect to server')
      this.socketIO.connect();
      
    },
  }
}
</script>

<style>
.main-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
}
</style>
