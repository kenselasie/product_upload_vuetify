<template>
  <v-container>
 <v-row class="my-5">
    <v-btn @click="bulkDelete">Bulk delete</v-btn>
  </v-row>
  <v-row class="my-10">
      <v-file-input show-size
    truncate-length="15" v-model="csv_document" placeholder="Bulk upload"></v-file-input>
    <v-btn @click="bulkUpload">Upload</v-btn>
  </v-row>
 

    <v-data-table :headers="headers" :items="products" class="elevation-1 mt-10" :loading="isLoading" :search="search"
    loading-text="Loading... Please wait">
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title>Total Entire Products ({{totalProducts || 'loading...'}})</v-toolbar-title>
        <v-divider class="mx-4" inset vertical></v-divider>
        <v-spacer></v-spacer>
        
        <v-dialog v-model="dialog" max-width="500px">
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="dark" dark class="mb-2" v-bind="attrs" v-on="on">
              Add New Product
            </v-btn>

            <v-text-field v-model="search" append-icon="mdi-magnify" label="Search"  single-line hide-details ></v-text-field>
            
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
                      label="Product Name"
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
                    ></v-text-field>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-text-field
                      v-model="editedItem.active"
                      label="Status"
                    ></v-text-field>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-text-field
                      v-model="editedItem.description"
                      label="description"
                    ></v-text-field>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-text-field
                      v-model="editedItem.created_at"
                      label="created_at"
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
    <v-pagination v-if="totalPages" v-model="page" :total-visible="7" :next="nextPage" :length="totalPages" ></v-pagination>
  </v-container>
</template>

<script>
import moment from 'moment';
import { getAllProductsService, addSingleProductService, deleteAllProductsService, addBulkProductService, deleteProductService, updateProductService } from '../services'
  export default {
    data: () => ({
      totalPages: 0,
      page: 1,
      next: null,
      previous: null,
      search: '',
      isLoading: false,
      options: {},
      dialog: false,
      dialogDelete: false,
      csv_document: null,
      headers: [
        { text: 'Product Name', align: 'start', sortable: false, value: 'name' },
        { text: 'SKU', value: 'sku', sortable: false, },
        { text: 'Status', value: 'active', sortable: false, },
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
        sku: 0,
        active: 0,
        description: 0,
        created_at: 0,
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
      page: async function (newValue, oldValue) {
        console.log(newValue)
        console.log(oldValue)
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
      }
    },

    created () {
      this.getProducts()
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
        let csvFormData = new FormData()
        csvFormData.append('file', this.csv_document)
        let upload = await addBulkProductService(csvFormData)
        if (upload) alert('Successfully uploaded')
        this.getProducts()
        this.csv_document = null
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

      closeDelete () {
        this.dialogDelete = false
        this.$nextTick(() => {
          this.editedItem = Object.assign({}, this.defaultItem)
          this.editedIndex = -1
        })
      },

      async nextPage() {
        console.log('next')
      },

      async save () {
        if (this.editedIndex > -1) {
          console.log(this.editedItem)
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