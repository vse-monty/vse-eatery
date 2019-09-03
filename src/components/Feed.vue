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

      const keys = Object.keys(orders_pkg)

      //for each order to process....
      for(let key of keys){

        //grab the order and the shared properties of the whole order, regardless of pages

        const order              = orders_pkg[key]  //this is the object that will represent a single order in the list
              order.pad          = 0 //this is for the proof margin padding
        const shared             = this.OrderSharedObject(order)  //the shared object properties of an order
        let   proofs             = []  //proof page locations incase we need to make it multi-page
        let   round              = Math.floor(shared.order_number / 1000) * 1000  //this is the folder number for final proofs
        let   foldername         = null  //folder name placeholder
        let   filename           = null  //file name placeholder
        let   final_proof        = null

        console.log(`order ${key} =>`)
        console.log(order)

        for(let j = 0; j < order.pages.length; j++){

          const page_number       = j + 1  //for proofing and save-file naming
          let   page_proof        = ''  //the return file-string to place in the proofs Array

          let   page              = order.pages[j]
                page.art          = ''
                page.art_back     = ''
                page.rider        = ''
                page.rider_back   = ''
                page.variablesObj = Object.assign({}, this.VarArrayToObject(page.variablesArr))
                page.page_number  = page_number
                page.total_pages  = order.pages.length
                page.page_text    = `Page ${page.page_number} of ${page.total_pages}`

          foldername    = `${this.BASE_PATH}/${shared.customer}/${shared.subdivision}/${page.type}/${shared.order_number}`
          filename      = page.page_number == 1 ?
                            `${foldername}/${shared.order_number}.ai`
                          : `${foldername}/${shared.order_number}_${page.page_number}.ai`

          page.art = await this.ProcessFile({ art:        encodeURI(page.file_art.replace(/\\/g, '/')),
                                              vars:       JSON.stringify(page.variablesObj),
                                              foldername: foldername,
                                              filename:   filename })

          if(!page.same_face){ //this will trigger if the page is double-faced with different faces

            filename      = page.page_number == 1 ?
                              `${foldername}/${shared.order_number}_back.ai`
                            : `${foldername}/${shared.order_number}_${page.page_number}_back.ai`
            page.pad      = 2
            page.art_back = await this.ProcessFile({ art:        encodeURI(page.file_art_back.replace(/\\/g, '/')),
                                                     vars:       JSON.stringify(page.variablesObj),
                                                     foldername: foldername,
                                                     filename:   filename })
          } else {
            
            page.art_back = page.art //otherwise we fill the back as the same art, just incase
          }

          if(page.has_riders){ //this will trigger if the page has riders

            filename      = page.page_number == 1 ?
                              `${foldername}/${shared.order_number}_rider.ai`
                            : `${foldername}/${shared.order_number}_${page.page_number}_rider.ai`
            page.pad      = 4
            page.rider    = await this.ProcessFile({ art: encodeURI(page.file_art_riders.replace(/\\/g, '/')),
                                                     vars:       JSON.stringify(page.variablesObj),
                                                     foldername: foldername,
                                                     filename:   filename })
            page.rider_back = page.rider
          }

          //create the proof for this page
          foldername = page.total_pages !== 1 ?
                          `${foldername}/_proofs`
                        : `${this.BASE_PATH}/_proofs/${round}`

          filename   = page.page_number !== 1 ?
                          `${foldername}/${shared.order_number}_${page.page_number}_proof.ai`
                        : `${foldername}/${shared.order_number}_proof.ai`

          page_proof = await this.ProcessFile({ art:        encodeURI(page.file_proof.replace(/\\/g, '/')),
                                                vars:       JSON.stringify(Object.assign({}, page, shared)),
                                                foldername: foldername,
                                                filename:   filename })

          proofs.push(encodeURI(page_proof));

        } //end for
        
        console.log('proofs => ' + order.order_number);
        console.log(proofs);
        //combine page-proofs into 1 order-proof
        foldername  = `${this.BASE_PATH}/_proofs/${round}`
        filename    = `${foldername}/${shared.order_number}_proof.ai`
        final_proof = await this.SimplifyProofs({arr: proofs, folder: foldername, fn: filename})

        foldername  = `${this.BASE_PRINT_PATH}/`
        filename    = `${this.BASE_PRINT_PATH}/${order.order_number}.pdf`

        let pdf = {
          art: final_proof,
          folder: foldername,
          file: filename,
          quality: PDF_LQ,
          view: true
        }
        
        if(await this.SaveAsPDF(pdf)){

         this.socketIO.emit('order.completed', JSON.stringify(order));
        }
       
      } //end for
    }, //end method

    SimplifyProofs (data) {

      if(data.arr.length == 1){
        return new Promise(function (resolve, reject) {
          resolve(data.fn)
        })
      } 
     
     return new Promise(function(resolve, reject) {
       runscript(`SimplifyProof(${JSON.stringify(data.arr)})`)
         .then(runscript(`mkdir('${data.folder}')`)) 
         .then(runscript(`SaveAsAI('${data.fn}')`))
         .then(runscript(`CloseOpenDocument()`))
         .then(function(){ resolve(data.fn) })
         .catch(function(error){ reject(error) }) 
     })
    },

    ProcessFile (working) {

      console.log(working);

     return new Promise(function(resolve, reject) {
       runscript(`OpenWorkingFile('${working.art}')`)
         .then(runscript(`ReplaceVariablesinOpen(${working.vars})`))
         .then(runscript(`mkdir('${working.foldername}')`))
         .then(runscript(`SaveAsAI('${working.filename}')`))
         .then(runscript(`CloseOpenDocument()`))
         .then(function(){ resolve(working.filename) })
         .catch(function(error){ reject(error) }) 
     })
    },

    SaveAsPDF (working) {

      return new Promise(function(resolve, reject) {
        runscript(`OpenWorkingFile('${working.art}')`)
        .then(runscript(`mkdir('${working.folder}')`))
        .then(runscript(`SaveAsPDF(${JSON.stringify({quality: PDF_LQ, view: true, file: working.file})})`))
        .then(runscript(`CloseOpenDocument()`))
        .then(function(){ resolve(true) })
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

      let keys = Object.keys(order)
      let obj = {}

      for(let idx of keys){

        if(!Array.isArray(order[idx])){
          obj[idx] = order[idx]
        }
      }

      obj.artist = 'Dan'
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
