const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
	"b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
	"9sm5xK": {longURL: "http://www.google.com", userID: "user2RandomID"}
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const personalURLs = {};

function urlsForUser(id){
	for(let key in urlDatabase){
		if(urlDatabase[key].userID === id){
			personalURLs[id] = {};
			personalURLs[id][key] = urlDatabase[key];
		}
	}
	console.log(personalURLs);
}

app.get('/', function (req, res) {
  console.log('Cookies: ', req.cookies);
});

app.get("/", (req, res) => {
	res.end("Hello!");
});

app.get("/urls", (req, res) => {
	if(!req.cookies.userid){
		let templateVars = {user: users[req.cookies.userid], loggedin : false};
		res.render("urls_login", templateVars);
	} else{
		console.log(urlsForUser(req.cookies.userid));
		console.log(personalURLs);
		let templateVars = { urls: personalURLs[req.cookies.userid],
		user: users[req.cookies.userid] };
		res.render("urls_index", templateVars);
	}
});

app.get("/urls/new", (req, res) => {
	if(!users[req.cookies.userid]){
		let templateVars = {user: users[req.cookies.userid], loggedin : false};
		res.render("urls_login", templateVars);
	}
	else{
	let templateVars = { urls: urlDatabase,
		user: users[req.cookies.userid]  };
	res.render("urls_new", templateVars);
	}
});

app.get("/urls/:id", (req, res) => {
	if(!req.cookies.userid){
		let templateVars = {user: users[req.cookies.userid], loggedin : false};
		res.render("urls_login", templateVars);
	} else{
		let templateVars = { 
		shortURL: req.params.id, 
		fullURL: urlDatabase[req.params.id].longURL, 
		user: users[req.cookies.userid]   };
	res.render("urls_show", templateVars);
	}
});

app.get("/register", (req, res) => {
	let templateVars = {user: users[req.cookies.userid], loggedin: true };
	res.render("urls_reg", templateVars);
});

app.get("/login", (req, res) => {
	let templateVars = { user: users[req.cookies.userid], loggedin: true };
	res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
	console.log(urlDatabase);
	let uniqueId = generateRandomString();
	urlDatabase[uniqueId] = {};
	urlDatabase[uniqueId].longURL = req.body.longURL;
	urlDatabase[uniqueId].userID = req.cookies.userid;
	console.log(urlDatabase);
	res.redirect('http://localhost:8080/urls/');  
});

app.post("/urls/:id/delete", (req, res) => { 
	if(urlDatabase[req.params.id].userID !== req.cookies.userid){
		res.redirect('http://localhost:8080/urls/');
	} else{
		delete urlDatabase[req.params.id];
		console.log(urlDatabase);
		res.redirect('http://localhost:8080/urls/');
	}  
});

app.post("/urls/:id", (req, res) => { 
	if(urlDatabase[req.params.id].userID !== req.cookies.userid){
		res.redirect('http://localhost:8080/urls/');
	} else{
		urlDatabase[req.params.id].longURL = req.body.currentURL;
		console.log(urlDatabase);
		res.redirect('http://localhost:8080/urls/');  
	}  
});

app.post("/login", (req, res) => { 
	for (let key in users){
		if(req.body.email === users[key].email && bcrypt.compareSync(req.body.password, users[key].password)){
			console.log(users);
			res.cookie('userid', users[key].id);
			res.redirect('http://localhost:8080/urls/');
		}	
	}
	res.status(403).send({ error: 'Please verify your credentials!' });  
});

app.post("/logout", (req, res) => { 
	res.clearCookie('userid');
	res.redirect('http://localhost:8080/login/');  
});

app.post("/register", (req, res) => { 
	for (let key in users){
		if(req.body.email === users[key].email){
			res.status(400).send({ error: 'That email address is already registered!' });
			break;
		}
	}
	if(req.body.email.length === 0){
		res.status(400).send({ error: 'Make sure you enter a valid email!' });
	}
	else if(req.body.password.length === 0){
		res.status(400).send({ error: 'Make sure you enter a valid password!' });
	} 
	else {
	let uniqueId = generateRandomString();
	users[uniqueId] = {};
	users[uniqueId].id = uniqueId;
	users[uniqueId].email = req.body.email;
	let passwordToHash = req.body.password;
	users[uniqueId].password = bcrypt.hashSync(passwordToHash, 10);
	res.cookie('userid', uniqueId);
	console.log(req.cookies);
	console.log(users);
	res.redirect('http://localhost:8080/urls/');  
	}
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  console.log(longURL);
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString() {
	let chars = [0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
	let result = '';
	for (let i = 0; i < 6; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return(result);
}

