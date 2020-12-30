import mongoose from 'mongoose'

// Replace this with your MONGOURI.
const MONGOURI = "mongodb+srv://aweldy:Ninsmash2@cluster0.vjurw.mongodb.net/Cluster0?retryWrites=true&w=majority";

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect(MONGOURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to DB !!");
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export default InitiateMongoServer;