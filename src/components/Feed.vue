<template>
  <div class="main-content">
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
import series from 'async/series'
import { Promise } from 'q';
const BASE_PATH = '/c/users/dmontgomery/documents/test/vse/work order files';
const BASE_PRINT_PATH = '/c/users/dmontgomery/documents/test/vse/WIP';
const PDF_LQ = 'Small PDF';
const PDF_HQ = '[High Quality Print]';

export default {
  data: ()=> ({

    orders: [   '118104',
                '118105',
                '118106',
                '118115'],

    csi: null,
    socketIO: null,
    workingOrder: null,

  }),

  computed: {

    app () {
      return this.$root.$children[0];
    },
  },

  mounted () {

    this.app.home = this;
    this.csi = this.$root.$children[0].csInterface;

    var path = './src/host/ILST/host.jsx';
    jsx.file(path);

    this.socketIO = io('http://localhost:9574', {
      autoConnect: true,
    });

    this.socketIO.on('connect', () => {

      this.socketIO.emit('illustrator'); //let the server know who we are
    });


    this.csi.addEventListener('document.variables', (event) => {

        if(event.data.length == 0){

          return;
        }

        this.socketIO.emit('give.variables', JSON.stringify({type: event.type, data: event.data}));
      });

    this.socketIO.on('get.variables', (data) => {

            jsx.eval(`GetOpenDocumentVariables('${data}')`, function(result){
              console.log(`result: ${result}`);
            });
      });

    this.socketIO.on('process.order', (data) => {

        console.log('process.order received from server!');
        this.workingOrder = JSON.parse(data);
        this.processOrder(this.workingOrder);
      });

    this.socketIO.on('process.batch', (data) => {

        console.log('process.batch received from server!');
        this.processBatch(JSON.parse(data));
      });

  },

  methods: {

    connectTo () {
      
      console.log('attempting to connect to server')
      this.socketIO.connect();
    },

    processOrder (order) {

      order.art = '';
      order.art_back = '';
      order.variablesObj = {};
      
      let arr = order.variablesArr;
      let obj = {};

      for(var i = 0; i < arr.length; i++){
        obj[arr[i].name] = arr[i].value;
      }

      Object.assign(order.variablesObj, obj);

      console.log(order);

      let j = jsx;
      let runscript = function(script){
          return new Promise( function (resolve, reject) {
            j.eval(script, resolve);
        } );
      }

      let foldername = `${BASE_PATH}/${order.customer}/${order.subdivision}/${order.type}/${order.orderNumber}`;
      let filename = `${BASE_PATH}/${order.customer}/${order.subdivision}/${order.type}/${order.orderNumber}/${order.orderNumber}.ai`;
      let filename_back = `${BASE_PATH}/${order.customer}/${order.subdivision}/${order.type}/${order.orderNumber}/${order.orderNumber}_back.ai`;
      
      let round = Math.floor(order.orderNumber / 1000) * 1000;
      let foldername_proof = `${BASE_PATH}/_proofs/${round}`;
      let filename_proof = `${BASE_PATH}/_proofs/${round}/${order.orderNumber}_proof.ai`;
      let filename_proof_pdf = `${BASE_PRINT_PATH}/${order.orderNumber}.pdf`

      if(order.same_face == true){ //this sucks, but i need it to work for now

        order.art_back = order.art = filename;
        runscript(`OpenWorkingFile('${encodeURI(order.file_art)}')`)
          .then(runscript(`ReplaceVariablesinOpen(${JSON.stringify(order.variablesObj)})`))
          .then(runscript(`mkdir('${foldername}')`))
          .then(runscript(`SaveAsAI('${filename}')`))
          .then(runscript(`CloseOpenDocument()`))
          .then(runscript(`OpenWorkingFile('${encodeURI(order.file_proof)}')`))
          .then(runscript(`ReplaceVariablesinOpen(${JSON.stringify(order)})`))
          .then(runscript(`mkdir('${foldername_proof}')`))
          .then(runscript(`SaveAsAI('${filename_proof}')`))
          .then(runscript(`Print()`))
          .then(runscript(`SaveAsPDF(${JSON.stringify({quality: PDF_LQ, view: false, filename: filename_proof_pdf})})`))
          .then(runscript(`CloseOpenDocument()`))
          .catch(function(error){console.log(error)})
      
      } else {

        order.art = filename;
        order.art_back = filename_back;
        runscript(`OpenWorkingFile('${encodeURI(order.file_art)}')`)
          .then(runscript(`ReplaceVariablesinOpen(${JSON.stringify(order.variablesObj)})`))
          .then(runscript(`mkdir('${foldername}')`))
          .then(runscript(`SaveAsAI('${filename}')`))
          .then(runscript(`CloseOpenDocument()`))
          .then(runscript(`OpenWorkingFile('${encodeURI(order.file_art_back)}')`))
          .then(runscript(`ReplaceVariablesinOpen(${JSON.stringify(order.variablesObj)})`))
          .then(runscript(`SaveAsAI('${filename_back}')`))
          .then(runscript(`CloseOpenDocument()`))
          .then(runscript(`OpenWorkingFile('${encodeURI(order.file_proof)}')`))
          .then(runscript(`ReplaceVariablesinOpen(${JSON.stringify(order)})`))
          .then(runscript(`mkdir('${foldername_proof}')`))
          .then(runscript(`SaveAsAI('${filename_proof}')`))
          .then(runscript(`Print()`))
          .then(runscript(`SaveAsPDF(${JSON.stringify({quality: PDF_LQ, view: true, filename: filename_proof_pdf})})`))
          .then(runscript(`CloseOpenDocument()`))
          .catch(function(error){console.log(error)})
      }

      //send complete
    },

    processBatch (orders_arr) {

      for (const order of orders_arr) {
        this.processOrder(order);
      }
    },
  },

  beforeDestroy () {
    this.socketIO.disconnect();
  },
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
