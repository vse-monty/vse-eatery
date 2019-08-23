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
import { Promise } from 'q'

// const BASE_PATH = '/c/users/dmontgomery/documents/test/vse/work order files';
// const BASE_PRINT_PATH = '/c/users/dmontgomery/documents/test/vse/WIP';

const PDF_LQ = 'Small PDF'
const PDF_HQ = '[High Quality Print]'

const runscript = function(script){ return new Promise( (resolve, reject) => { jsx.eval(script, resolve) }) }

export default {
  data: () => ({

    orders: [],

    csi: null,
    socketIO: null,
    workingOrder: null,

    settings: {

      base_path: null,
      base_print_path: null,
    }

  }),

  computed: {

    app () {
      return this.$root.$children[0]
    },

    BASE_PATH () {
      return this.settings.working ? this.settings.working.replace(/\\/g, '/') : `${this.app.identity.root}/working`
    },

    BASE_PRINT_PATH () {
      return this.settings.working ? this.settings.print.replace(/\\/g, '/') : `${this.app.identity.root}/print`
    }
  },

  mounted () {

    this.app.home = this
    this.csi = this.$root.$children[0].csInterface

    var path = './src/host/ILST/host.jsx'
    jsx.file(path)

    this.socketIO = io('http://localhost:9574', { autoConnect: true })
    this.BuildEventListeners();
  },

  methods: {

    ConnectTo () {
      
      console.log('attempting to connect to server')
      this.socketIO.connect();
    },

    async ProcessOrders (orders_pkg) {

      const keys = Object.keys(orders_pkg);

      //for each order to process....
      for(let key of keys){

        //grab the order and the shared properties of the whole order, regardless of pages

        const order              = orders_pkg[key]  //this is the object that will represent a single order in the list
        const shared             = this.OrderSharedObject(order) //the shared object properties of an order

        console.log(`order ${key} =>`)

        for(let j = 0; j < order.pages.length; j++){

          const page_number       = j + 1 //wil need this for proofing and save-file naming

          let   page              = order.pages[j]
                page.art          = ''
                page.art_back     = ''
                page.variablesObj = Object.assign({}, this.VarArrayToObject(page.variablesArr))
                page.page_number  = page_number
                page.total_pages  = order.pages.length

          console.log(`-- page ${page_number} ->`)
          console.log(page)

        }

        // let foldername    = `${this.BASE_PATH}/${shared.customer}/${shared.subdivision}/${page.type}/${shared.orderNumber}`;
        // let filename      = `${foldername}/${shared.orderNumber}_${shared.page_number}.ai`;
        // let filename_back = `${foldername}/${shared.orderNumber}_back.ai`;

        // let round = Math.floor(order.orderNumber / 1000) * 1000;
        // let foldername_proof   = `${this.BASE_PATH}/_proofs/${round}`;
        // let filename_proof     = `${foldername_proof}/${order.orderNumber}_proof.ai`;
        // let filename_proof_pdf = `${this.BASE_PRINT_PATH}/${order.orderNumber}.pdf`;

        //   .then(runscript(`OpenWorkingFile('${encodeURI(order.file_proof)}')`))
        //   .then(runscript(`ReplaceVariablesinOpen(${JSON.stringify(order)})`))
        //   .then(runscript(`SaveAsAI('${filename_proof}')`))
        //   //.then(runscript(`Print()`))
        //   .then(runscript(`mkdir('${this.BASE_PRINT_PATH}')`))
        //   .then(runscript(`SaveAsPDF(${JSON.stringify({quality: PDF_LQ, view: false, filename: filename_proof_pdf})})`))
        //   .then(runscript(`CloseOpenDocument()`))

        //build each of the art files for each 'page'
        // (set vars, save file)
        
        //build proof for each 'page', checking to see if multi-page
        //if it's not multi-page, set proof in intended space
        //if it is multi-page -> build each single page, saving to the working folder
        //then create the full proof, put in intended space, linking the other proofs in order

        //save and print
        
        //let app know this order is completed
      }
      //continue....

    },

    ProcessFile (working) {

     return new Promise(function(resolve, reject) {
       runscript(`OpenWorkingFile('${working.art}')`)
         .then(runscript(`ReplaceVariablesinOpen(${working.vars})`))
         .then(runscript(`mkdir('${working.foldername}')`))
         .then(runscript(`SaveAsAI('${working.filename}')`))
         .then(runscript(`CloseOpenDocument()`))
         .then(function(){ resolve() })
         .catch(function(error){ reject(error) }) 
     })
    },

    VarArrayToObject (arr) { //takes the order's 'variablesArr' array of objects and turns it into an object
      
      let obj = {};
      
      for(let val of arr) {
        obj[val.name] = val.value
      }

      return obj
    },

    OrderSharedObject (order) {

      let keys = Object.keys(order);
      let obj = {};

      for(let idx of keys){

        if(!Array.isArray(order[idx])){
          obj[idx] = order[idx]
        }
      }

      return obj
    },

    BuildEventListeners () {

      /* 
       * ==========================
       *   SERVER EVENT LISTENERS
       * ========================== 
       */

      //inform server that the socket emmiting is illustrator
      this.socketIO.on('connect', () => { this.socketIO.emit('illustrator') })

      //settings for file locations, etc... sent over from the app
      this.socketIO.on('settings', (data) => { Object.assign(this.settings, JSON.parse(data)) })

      //app is requesting to get the variables out of a file (data)
      this.socketIO.on('get.variables', (data) => { jsx.eval(`GetOpenDocumentVariables('${data}')`) })

      //app is requesting us to create the orders from provided data
      this.socketIO.on('process', (data) => { this.ProcessOrders(JSON.parse(data)) })

      /* 
       * ===============================
       *   ILLUSTRATOR EVENT LISTENERS
       * ===============================
       */

      //illustrator message, sending variables found in the provided document
      this.csi.addEventListener('document.variables', (event) => {
        
        if (event.data.length !== 0) {
          this.socketIO.emit('give.variables', JSON.stringify({type: event.type, data: event.data}))
        }
      })

    },
  },

  beforeDestroy () { this.socketIO.disconnect() },
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
