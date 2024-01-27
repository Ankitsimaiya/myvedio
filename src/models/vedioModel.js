import mongoose ,{Schema} from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const vedioSchema = new Schema({
    videoFile:{
        type:String, // cloudinary url
        required:true
    },
    thumbnail:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    discription:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    view:{
        type:String,
        default:0
    },
    isPublished:{
        type:boolean,       
    },
    owner:{
        type:Schema.Type.ObjectId,
        ref:'User'
    }
},{timestamp:true})

vedioSchema.plugin(mongooseAggregatePaginate)

export const Vedio = new mongoose.model("Vedio", vedioSchema)