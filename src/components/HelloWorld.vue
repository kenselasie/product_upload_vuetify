<template>
  <v-container>
   
    <v-row class="mt-5" v-if="totalProducts">
      <h3>Total Products: {{ totalProducts }}</h3>
    </v-row>
  
  <v-row class="my-6">
    <v-file-input show-size truncate-length="15" class="mb-5" outlined dense style="max-width: 500px" v-model="csv_document" placeholder="Bulk upload"></v-file-input>
      <v-btn @click="bulkUpload" :disabled="csv_document ? false : true" class="ml-5">Upload</v-btn>
    
  </v-row>
  
  <!-- <div v-if="isUploading">
    <progress  max="100" :value="uploadPercentage">Progress</progress> 
    <h3>{{uploadPercentage + '%'}}</h3>
  </div> -->

  <div v-if="isUploading" class="mb-7">
    <b class="mr-5">Uploading to server</b>
    <v-progress-circular
        :rotate="360"
        :size="90"
        :width="15"
        :value="uploadPercentage"
        color="teal"
      >
        {{ uploadPercentage }}
      </v-progress-circular>
  </div>
  <div v-if="uploadPercentage == '100'" >Preparing to upload ...</div>
  <div class="mb-7" v-if="writingProgress && writingProgress <= 95">
    <b class="mr-5">Saving to database</b>
    <v-progress-circular
        :rotate="360"
        :size="90"
        :width="15"
        :value="writingProgress"
        color="teal"
      >
        {{ writingProgress }}
      </v-progress-circular>
  </div>
  <!-- <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details ></v-text-field> -->
  <v-text-field v-model="searchBackend" append-icon="mdi-magnify" outlined dense label="Search Products" single-line hide-details ></v-text-field>

    <v-data-table :headers="headers" :items="products" class="elevation-1 mt-10" :loading="isLoading" :items-per-page="15" :search="search" loading-text="Loading... Please wait">
    <template v-slot:top>
      <v-toolbar flat>
        <!-- <v-toolbar-title>Total Entire Products ({{totalProducts || 'loading...'}})</v-toolbar-title>
        <v-divider class="mx-4" inset vertical></v-divider> -->
        
        

       
        <v-row>
           <v-select
          :items="activeFields"
          label="ACTIVE STATUS"
          v-model="statusToFilter"
          outlined
          dense
          style="max-width: 200px; max-height: 40px"
          solo
        ></v-select>
        </v-row>

       <v-spacer></v-spacer>
       <!-- <v-row class="my-5"> -->
          <v-btn dark color="error" @click="bulkDelete">Bulk delete</v-btn>
        <!-- </v-row> -->
        
        
        <v-dialog v-model="dialog" max-width="500px">
         <template v-slot:activator="{ on, attrs }">
           <v-btn color="success" dark class="ml-3" v-bind="attrs" v-on="on">
            Add New Product
          </v-btn>
        
      </template>
          
          <v-card>
            <v-card-title>
              <span class="text-h5">{{ formTitle }}</span>
            </v-card-title>


            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12"  sm="6" md="4"  >
                    <v-text-field
                      v-model="editedItem.name"
                      label="Name"
                      outlined
                      dense
                    ></v-text-field>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-text-field
                      v-model="editedItem.sku"
                      label="sku"
                      val
                      outlined
                      dense
                    ></v-text-field>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                    outlined
                      dense
                  >
                    <v-select
                    :items="activeFieldsBoolean"
                     v-model="editedItem.active"
                      label="Active"
                    outlined
                      dense
                  ></v-select>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-text-field
                      v-model="editedItem.description"
                      label="description"
                      outlined
                      dense
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="blue darken-1"
                text
                @click="close"
              >
                Cancel
              </v-btn>
              <v-btn
                color="blue darken-1"
                text
                @click="save"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog v-model="dialogDelete" max-width="500px">
          <v-card>
            <v-card-title class="text-h5">Are you sure you want to delete this item?</v-card-title>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="closeDelete">Cancel</v-btn>
              <v-btn color="blue darken-1" text @click="deleteItemConfirm">OK</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-icon
        small
        class="mr-2"
        @click="editItem(item)"
      >
        mdi-pencil
      </v-icon>
      <v-icon
        small
        @click="deleteItem(item)"
      >
        mdi-delete
      </v-icon>
    </template>
  </v-data-table>
    <v-pagination v-if="totalPages" v-model="page" :total-visible="1" :length="totalPages" ></v-pagination>
  </v-container>
</template>

<script>
import moment from 'moment'
import Pusher from 'pusher-js'
import { axios } from '../services/axios'
// import socketMixins from '../mixins/sockets'
import { getAllProductsService, toggleActiveProductsService, addSingleProductService, searchProductsService, deleteAllProductsService, deleteProductService, updateProductService } from '../services'
  export default {
    // mixins: [socketMixins],
    data: () => ({
      totalPages: 0,
      uploadPercentage: 0,
      channel_name: 'my-channel',
      password: 'my-event',
      writingProgress: 0,
      isUploading: false,
      page: 1,
      next: null,
      previous: null,
      search: '',
      searchBackend: '',
      statusToFilter: '',
      isLoading: false,
      options: {},
      dialog: false,
      dialogDelete: false,
      csv_document: null,
      activeFields: ['Active', 'InActive', 'All'],
      activeFieldsBoolean: [true, false],
      headers: [
        { text: 'Name', align: 'start', sortable: false, value: 'name' },
        { text: 'SKU', value: 'sku', sortable: false, },
        { text: 'Active', value: 'active', sortable: false, },
        { text: 'Description', value: 'description', sortable: false, },
        { text: 'Created At', value: 'created_at', sortable: false, },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      totalProducts: null,
      products: [],
      editedIndex: -1,
      editedUUID: {},
      editedItem: {
        name: '',
        sku: null,
        active: null,
        description: null,
        created_at: null,
      },
      defaultItem: {
        name: '',
        sku: 0,
        active: 0,
        description: 0,
        created_at: 0,
      },
    }),

    computed: {
      formTitle () {
        return this.editedIndex === -1 ? 'New Item' : 'Edit Item'
      },
    },

    watch: {
      dialog (val) {
        val || this.close()
      },
      dialogDelete (val) {
        val || this.closeDelete()
      },
      // whenever question changes, this function will run
      page: async function (newValue) {
        console.log(newValue)
        this.isLoading = true
        const products = await getAllProductsService(newValue)
        this.totalProducts = products.count
        this.totalPages = Math.ceil(this.totalProducts / 20)
        this.next = products.next
        this.previous = products.previous
        this.products = products.results.map(el => {
          el.created_at = moment(el.created_at).format('D/MM/YY, h:mm a')
          return el
        })
        this.isLoading = false
      },
      searchBackend: async function (newValue, oldValue) {
        if (newValue === '') await this.getProducts()
        if (!newValue) return
        if (newValue.length % 2 !== 0) return
        console.log(newValue, oldValue)
        this.isLoading = false
        const products = await searchProductsService(newValue)
        this.totalProducts = products.count
        this.totalPages = Math.ceil(this.totalProducts / 20)
        this.next = products.next
        this.previous = products.previous
        this.products = products.results.map(el => {
          el.created_at = moment(el.created_at).format('D/MM/YY, h:mm a')
          return el
        })
        this.isLoading = false
      },
      statusToFilter: async function (newValue, oldValue) {
        if (newValue === 'All') await this.getProducts()
        if (!newValue) return
        console.log(newValue, oldValue)
        let keyword = ''
        if (newValue == 'Active') {
          keyword = true
        }
        if (newValue == 'InActive') {
          keyword = false
        }
        this.isLoading = false
        const products = await toggleActiveProductsService(keyword)
        this.totalProducts = products.count
        this.totalPages = Math.ceil(this.totalProducts / 20)
        this.next = products.next
        this.previous = products.previous
        this.products = products.results.map(el => {
          el.created_at = moment(el.created_at).format('D/MM/YY, h:mm a')
          return el
        })
        this.isLoading = false
      },
    },

    created () {
      this.getProducts()
    },
    mounted() {
      this.subscribe(this.channel_name, this.password)
    },

    methods: {
      async getProducts () {
        this.isLoading = true
        try {
          const products = await getAllProductsService()
          this.totalProducts = products.count
         
          this.totalPages = Math.ceil(this.totalProducts / 20)
          this.next = products.next
          this.previous = products.previous
          this.products = products.results.map(el => {
            el.created_at = moment(el.created_at).format('D/MM/YY, h:mm a')
            return el
          })
          this.isLoading = false
        } catch (e) {
          console.log(e)
          this.isLoading = false

        } 
      },
      editItem (item) {
        this.editedIndex = this.products.indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialog = true
      },

      async bulkUpload() {
        if (!this.csv_document) return alert('Please upload a file')
        this.isUploading = true
        let csvFormData = new FormData()
        csvFormData.append('file', this.csv_document)

        const { data } = await axios.post('/workflow/product/bulk/upload', csvFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: function( progressEvent ) {
            this.uploadPercentage = parseInt( Math.round( ( progressEvent.loaded / progressEvent.total ) * 100 ) );
          }.bind(this)
        })

        if (data) alert('Successfully uploaded')
        this.getProducts()
        this.csv_document = null
        this.isUploading = false

      },


      async bulkDelete() {
        try {
          let bulkdelete = await deleteAllProductsService()
          if (bulkdelete) alert('Successfully deleted')
          this.getProducts()
        } catch (e) {
          console.log(e)
        } 
      },

      deleteItem (item) {
        this.editedIndex = this.products.indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialogDelete = true
      },

      async deleteItemConfirm () {
        console.log(this.editedItem)
        try {
          await deleteProductService(this.editedItem.uuid)
        } catch(e) {
          console.log(e)
        }
        // this.products.splice(this.editedIndex, 1)
        this.getProducts()
        this.closeDelete()
      },

      close () {
        this.dialog = false
        this.$nextTick(() => {
          this.editedItem = Object.assign({}, this.defaultItem)
          this.editedIndex = -1
        })
      },
      subscribe (channel_name, password) {
          let pusher = new Pusher("fa9439448253b3443965", {
            cluster: "eu", // gotten from Pusher app dashboard
            encrypted: true // optional
          })
          pusher.subscribe(channel_name)
          pusher.bind(password, data => {
            console.log(data)
            this.writingProgress = parseInt(data.message)
            this.uploadPercentage = 0
            console.log(this.writingProgress)
          })
      },
      closeDelete () {
        this.dialogDelete = false
        this.$nextTick(() => {
          this.editedItem = Object.assign({}, this.defaultItem)
          this.editedIndex = -1
        })
      },

      async save () {
        if (this.editedIndex > -1) {
          // console.log(this.editedItem)
          // const { active, description, name, sku } = this.editedItem

          // if (!active) return alert('Active field is required')
          // if (!description) return alert('Description field is required')
          // if (!name) return alert('name field is required')
          // if (!sku) return alert('sku field is required')
          try {
            const update = await updateProductService(this.editedItem.uuid, {
              active: this.editedItem.active,
              description: this.editedItem.description,
              name: this.editedItem.name,
              sku: this.editedItem.sku
            })
            console.log(update)
          } catch (e) {
            console.log(e)
          }
          Object.assign(this.products[this.editedIndex], this.editedItem)
        } else {
          try {

            const add = await addSingleProductService({
              active: this.editedItem.active,
              description: this.editedItem.description,
              name: this.editedItem.name,
              sku: this.editedItem.sku
            })
            console.log(add)
          } catch (e) {
            console.log(e)
          }
          this.getProducts()
        }
        this.close()
      },
    },
  }
</script>