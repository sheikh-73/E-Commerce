const port = 4000;
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const product = require("./models/product");
const { error } = require("console");
const User = require("./models/user");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("uploads/images"));
app.use(express.static("uploads/videos"));
app.use(cookieParser());

// database connect:
mongoose.connect("mongodb+srv://root:mongodb@cluster0.s1ercuu.mongodb.net/e-commerce");

// for image and videos:
const imageStorage = multer.diskStorage({
    destination: "./uploads/images",
    filename: (req, file, CB) => {
        return CB(null, file.fieldname+Date.now()+path.extname(file.originalname));
    }
});

const imageUpload = multer({storage: imageStorage});

const videoStorage = multer.diskStorage({
    destination: "./uploads/images",
    filename: (req, file, CB) => {
        return CB(null, file.fieldname+Date.now()+path.extname(file.originalname));
    }
});

const videoUpload = multer({storage: videoStorage});



// create API for sevrer running message:
app.get("/msg", (req, res) => {
    res.send("server running...");
});


// creating API for product add:
app.post("/add/product", imageUpload.single("image"), async (req, res) => {
    try
    {
        const Product = new product({
            product_id: req.body.id,
            name: req.body.name,
            category: req.body.category,
            new_price: req.body.new_price,
            old_price: req.body.old_price,
            image: req.file.filename
        });
    
        await Product.save();
        res.json("Your product "+req.body.name+" is successfully save.");
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.json(error);
    }

});

// creating API for delete product:
app.delete("/delete/product/:id", async (req, res) => {
    try
    {
        const data = await product.findOneAndDelete({product_id: req.params.id});
        res.json("your product "+data.name+" successfully remove.");
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.json("This product isn't available.");
    }

});

// creating API for product price update:
app.put("/update/price", async (req, res) => {
    const Product = await product.findOne({product_id: req.body.id});
    if(Product)
    {
        Product.new_price = req.body.new_price;
        await product.findOneAndUpdate({_id: Product._id}, {new_price: Product.new_price});
        res.status(200).json("price update successful.");
    }
    else
    {
        res.status(400).json("this product is not available.");
    }
});

// creating API for get all products:
app.get("/all/products", async (req, res) => {
    try
    {
        let products = await product.find();
        res.json(products);
    }
    catch
    {
        console.log("Error: "+error);
        res.json(error);
    }
});

// creating user signup API:
app.post("/signup", async (req, res) => {
    try
    {
        let prevData = await User.findOne({email: req.body.email});
        if(prevData)
        {
            return res.status(400).json("email available !");
        }

        let cart = {};
        for(let i=0; i<300; i++)
        {
            cart[i] = 0;
        }
        const hashPass = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashPass,
            cartData: cart
        });

        await user.save();
        res.status(200).json("signup successful.");
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(400).json(error);
    }
});

// creating user signIn API:
app.post("/signin", async (req, res) => {
    try
    {
        const data = await User.findOne({email: req.body.email});
        if(data)
        {
            const checkPass = await bcrypt.compare(req.body.password, data.password);
            if(checkPass===true)
            {
                const token = jwt.sign({_id:data._id}, "key", {expiresIn: "30min"});
                res.cookie("token", token, {secure: true, maxAge: 30*60*1000});
                res.status(200).json("login successful");
                
            }
            else
            {
                res.status(400).json("incorrect password");
            }
        }
        else
        {
            res.status(400).json("incorrect email");
        }
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(400).json(error);
    }
});

// creating API for new collections:
app.get("/newcollections", async (req, res) => {
    let products = await product.find();
    let newProducts = (products.slice(1)).slice(-8);
    res.status(200).json(newProducts);
});

// creating API for searching product category:
app.get("/searchitems", async (req, res) => {
    const { s } = req.query;
    const products = await product.find({category: s});
    if(products)
    {
        res.status(200).json(products);
    }
    else
    {
        res.status(400).json("product is not available.");
    }
});

// creating API for cart add:
app.put("/addtocart/:id/:token", async (req, res) => {
    try
    {
        const decode = await jwt.verify(req.params.token, "key");
        const Product = await product.findOne({product_id: req.params.id});

        if(Product.availability===true && decode)
        {
            const user = await User.findOne({_id: decode._id});
            
            let flag = false;

             for(let i=0; i<300; i++)
             {
                if(flag === true)
                {
                    user.cartData[i] = user.cartData[i];
                }
                else if(user.cartData[i] == 0)
                {
                    user.cartData[i] = Product;
                    flag=true;
                }
             }
             await User.findOneAndUpdate({_id: user._id}, {cartData: user.cartData});

            res.status(200).json("Cart add successful.");
        }
        else
        {
            res.status(400).json("This item is not available");
        }
    }
    catch(error)
    {
        console.log("Error: "+error);
        res.status(400).json(error);
    }
});

// creating API for view cart:
app.get("/viewcart/:token", async (req, res) => {
    const decode = await jwt.verify(req.params.token, "key");
    if(decode)
    {
        const user = await User.findOne({ _id: decode._id});
        if(user)
        {
            let carts = {};
            carts[0] = 0;
            let j=0;

            for(let i=0; i<300; i++)
            {
                if(user.cartData[i] != 0)
                {
                    carts[j] = user.cartData[i];
                    j++;
                }
            }

            if(carts[0]===0)
            {
                res.status(200).json("No carts available");
            }
            else
            {
                res.status(200).json(carts);
            }
            
        }
        else
        {
            res.status(403).json("Wrong token");
        }

    }
    else
    {
        res.status(403).json("Please sign first.");
    }
});

// creating API for deleting cart:
app.delete("/deletecart/:productId/:token", async (req, res) => {
    const decode = await jwt.verify(req.params.token ,"key");
    const user = await User.findOne({_id: decode._id});
    if(user && decode)
    {
        let j=0;
        let flag = false;
        for(let i=0; i<300; i++)
        {
            
            if(user.cartData[i].product_id==req.params.productId)
            {
                flag = true;
            }
            else if(flag===true)
            {
                user.cartData[j] = user.cartData[i];
                j++;
            }
            else
            {
                user.cartData[j] = user.cartData[i];
                j++;
            }
        }
        j++;
        await User.findOneAndUpdate({_id: user._id}, {cartData: user.cartData});

        res.status(200).json("product delete successful.");
    }
    else
    {
        res.status(400).json("Signin first");
    }
});

// create API for show profile info:
app.get("/profile/:token", async (req, res) => {
    const decode = await jwt.verify(req.params.token, "key");
    const user = await User.findOne({_id: decode._id});

    if(decode && user)
    {
        res.status(200).json(user);
    }
    else
    {
        res.status(400).json("sign in first");
    }
});

app.listen(port, (error) => {
    if(!error)
    {
        console.log("server running...");
    }
    else
    {
        console.log("Error: "+error);
    } 
});