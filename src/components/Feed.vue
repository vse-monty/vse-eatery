<template>
  <div class="main-content">

        <v-btn
        @click="runScript()"
        color="primary"
        icon>
        <v-icon>mdi-arrow-right-bold</v-icon>
        </v-btn>

    <v-container grid-list-md text-xs-center>
    <v-layout column wrap>
      <v-flex v-for="order in orders" :key="order">

        <v-item>
          <v-card
            color="primary"
            dark
            class="align-center">
            <v-card-text class="px-0">order: {{order}}</v-card-text>
          </v-card>
        </v-item>

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

    objectToReturn: {
        info: true,
      },
  }),
  computed: {
    app() {
      return this.$root.$children[0];
    },
  },
  mounted() {
    this.app.home = this;
  },
  methods: {
    runScript(){
      let csi = this.$root.$children[0].csInterface;
      console.log(csi);
      csi.evalScript("getAlert()");
      //console.log('alerted!');
    }
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
