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

export default {
  data: ()=> ({
    orders: [   '118104',
                '118105',
                '118106',
                '118115'],

    csi: null,
    socket: null,

  }),
  computed: {
    app() {
      return this.$root.$children[0];
    },
  },
  mounted() {
    this.app.home = this;
    this.csi = this.$root.$children[0].csInterface;
    this.socket = this.$root.$children[0].socketIO;


    this.addAppListeners();

  },
  methods: {
    startServer(){
      //this.app.socketIO.connect();
      //console.log('attempting to start server panel');
      // console.log(this.csi);
      // try{
      //   this.csi.requestOpenExtension("com.vse-eatery-s.panel", "");}
      //   catch(err){
      //     console.log(err);
      //   }

      // console.log(this.csi.getExtension);
    },
    connectTo(){
      console.log('attempting to connect to server')
      this.app.socketIO.connect();
      
    },
    runScript(){
      this.csi.evalScript("getOpenDocumentVariables()");
    },
    addAppListeners(){
        //listener for getOpenDocumentVariables()
        //returns array of illustrator variables
        // event.data = [{name, type}]
        // type is either text or image
        this.csi.addEventListener("document.variables", function(event){
        console.log('received message from ILST');
        console.log('event type: ' + event.type);
        if(event.data.length == 0){
          console.log('no data received. file either has no variables, or is corrupted.');
          return;
        }
        console.log('data: ->');
        console.log(event.data);

        window.socketIO.emit('data', JSON.stringify(event));
        console.log('socket');
        console.log(window.socketIO);
      });

    },
  },
};
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
