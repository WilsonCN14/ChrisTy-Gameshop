var mysql = require('./dbcon.js');

var express = require('express');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var bodyParser = require('body-parser');
var path = require('path');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 55221);
app.use(express.static(path.join(__dirname, '/public')));

// ---------- HOMEPAGE ----------

app.get('/',function(req,res){
    res.render('employee-direct');
});

// ---------- CUSTOMER EXPERIENCE PAGE ----------

app.get('/customer',function(req,res,next){
  var context = {};
  	// Query that is used for the popular games table found within the customer experience page.  Selects the top 5 highest metacritic scored games from the Products table. 
    mysql.pool.query('SELECT * FROM products GROUP BY metacritic_score ORDER BY metacritic_score DESC LIMIT 5', function(err, rows, fields){
      if(err){
        next(err);
        return;
      }
      context.popular = rows;
      
      if(req.query.genre == 'all'){
        req.query.genre = '.*';
      } 
     // Query used to show separate genres (or all genres) on customer experience page. Selects from the Products table based on 'genre'.
     mysql.pool.query('SELECT * FROM products WHERE genre REGEXP ?', [req.query.genre || '.*'], function(err, rows, fields){
      if(err){
        next(err);
        return;
      }
      context.product = rows;
      res.render('customer', context);
      });
    });
});

// ---------- CUSTOMERS PAGE ----------

app.get('/employee-customers',function(req,res,next){
  var context = {};
  // Query used to search by customer_id on employee-customer page.  Selects from the Customers table based on the customer_id input.  
  mysql.pool.query('SELECT * FROM customers WHERE customer_id REGEXP ?', [req.query.customer_id || '.*'], function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.customer = rows;
    res.render('employee-customers', context);
  });
});

// Post request that allows for inserting into the Customer table on the employee-customer page.
app.post('/create-customer', function(req, res) {
  mysql.pool.query('INSERT INTO customers (first_name, last_name, rewards_points, email) VALUES (?, ?, ?, ?)',
  [req.body.first_name, req.body.last_name, req.body.rewards_points, req.body.email],
  function (err) {
      if (err) {
          throw err;
      }
  })
  res.redirect('/employee-customers');
}); 

// ---------- ADDRESSES PAGE ----------

app.get('/employee-addresses',function(req,res,next){
  var context = {};
  // Query used to search by street address on addresses page.  Selects from the Addresses table that matches the street address input.  
  mysql.pool.query('SELECT * FROM addresses WHERE street_address REGEXP ?', [req.query.street_address || '.*'], function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.address = rows;
    res.render('employee-addresses', context);
  });
});

// Post request that allows for inserting into the addresses table on the Addresses page. 
app.post('/create-address', function(req, res,next) {
  mysql.pool.query('INSERT INTO addresses (street_address, city, state, zip_code) VALUES (?, ?, ?, ?)',
  [req.body.street_address, req.body.city, req.body.state, req.body.zip_code],
  function (err) {
      if (err) {
          throw err;
      }
  })
  res.redirect('/employee-addresses');
}); 

// Get request that allows the user to delete a row from the Addresses table.  This also deletes a row from the customer_addresses table found on the Customer_Addresses page.
app.get('/delete', function(req,res,next) {
  var context = {};
  mysql.pool.query('DELETE a.*, c_a.* FROM addresses a LEFT JOIN customer_addresses c_a ON a.address_id = c_a.address_id  WHERE a.address_id=?', [req.query.address_id], function(err, result) {
    if(err){
      next(err);
      return;
    }
    res.send(null);
  });
});

// --------- ORDERS PAGE ----------

app.get('/employee-orders',function(req,res,next){
  var context = {};
  // Allows the user to choose 'all' will cause the query to display all values. 
  if(req.query.order_id == 'all'){
    req.query.order_id = '.*';
  }
  // Query used to search order_id on the Orders page.  Date format is changed for a more pleasant user experience.  Selects from the Orders table that matches the order_id input.  
  mysql.pool.query('SELECT *, DATE_FORMAT(date, "%Y-%m-%d") AS trueDate FROM orders WHERE order_id REGEXP ?', [req.query.order_id || '.*'], function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.orders = rows;
  // Query used within the customers column in the orders page.  It allows the user to choose an existing customer_id when adding new data rather than having to know the customer_id.
  mysql.pool.query('SELECT customer_id FROM customers', function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.customerdrop = rows;
  // Query used wihtin the address column in the orders page.  Allows the user to choose an existing address_id when adding new data rather than having to know the address_id. 
  mysql.pool.query('SELECT address_id FROM addresses', function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.addressdrop = rows;
  // Query used for the dropdown search option that displays distinct (if there are multiple) order_ids from the Orders table. 
  mysql.pool.query('SELECT DISTINCT order_id FROM orders', function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.dropdown = rows;
    res.render('employee-orders', context);
    });
  });
});
});
});

// Post request that allows the user to insert data into the Orders table. 
app.post('/create-order', function(req, res,next) {
    mysql.pool.query('INSERT INTO orders (customer_id, address_id, date, rewards_points_used, rewards_points_gained, shipping_cost, tax, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.body.customer_id, req.body.address_id, req.body.date, req.body.rewards_points_used, req.body.rewards_points_gained, req.body.shipping_cost, req.body.tax, req.body.total_cost],
    function (err) {
        if (err) {
            throw err;
        }
    })
    res.redirect('/employee-orders');
}); 

// --------- UPDATE ORDER PAGE ----------
app.get('/update-order-form',function(req,res,next){
  var context = {};
  if(req.query.order_id == 'all'){
    req.query.order_id = '.*';
  }
  // Query used to search order_id on the Orders page.  Date format is changed for a more pleasant user experience.
  mysql.pool.query('SELECT *, DATE_FORMAT(date, "%Y-%m-%d") AS trueDate FROM orders WHERE order_id = ?', [req.query.order_id], 
  function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.orders = rows;
  
  // Query used within the customers column in the orders page.  It allows the user to choose an existing customer_id when adding new data rather than having to know the customer_id.
  mysql.pool.query('SELECT customer_id FROM customers', function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.customerdrop = rows;

  // Query used wihtin the address column in the orders page.  Allows the user to choose an existing address_id when adding new data rather than having to know the address_id. 
  mysql.pool.query('SELECT address_id FROM addresses', function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.addressdrop = rows;

  // Query used for the dropdown search option that displays distinct (if there are multiple) order_ids from the Orders table.  
  mysql.pool.query('SELECT DISTINCT order_id FROM orders', function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.dropdown = rows;
    res.render('update-order-form', context);
    });
  });
});
});
});

// Post request for updating the chosen order. 
app.post('/update-order', function(req, res,next) {
  var customer = [req.body.customer_id];
  if (customer == "") {
    customer = null;
  }
  // Query that updates the order, in the Orders table, with the new information that was passed in.
  mysql.pool.query('UPDATE orders SET customer_id = ?, address_id= ?, date= ?, rewards_points_used= ?, rewards_points_gained= ?, shipping_cost= ?, tax= ?, total_cost = ? WHERE order_id = ?', [customer, req.body.address_id, req.body.date, req.body.rewards_points_used, req.body.rewards_points_gained, req.body.shipping_cost, req.body.tax, req.body.total_cost, req.body.order_id],
  function (err) {
      if (err) {
          throw err;
      }
  })
  res.redirect('/employee-orders');
}); 

// ---------- PRODUCTS PAGE ----------

app.get('/employee-products',function(req,res,next){
  var context = {};
  // Query that allows the user to search by both 'name' and 'genre' from the Products table.   
  mysql.pool.query('SELECT * FROM products WHERE name REGEXP ? AND genre REGEXP ?', [req.query.name || '.*', req.query.genre || '.*'], function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.product = rows;
    res.render('employee-products',context);
  });
});

// Allows the user to insert their own data into the Products table. 
app.post('/create-product', function(req, res) {
  mysql.pool.query('INSERT INTO products (genre, name, publisher, metacritic_score, product_cost, inventory) VALUES (?, ?, ?, ?, ?, ?)',
  [req.body.genre, req.body.name, req.body.publisher, req.body.metacritic_score, req.body.product_cost, req.body.inventory],
  function (err) {
      if (err) {
          throw err;
      }
  })
  res.redirect('/employee-products');
}); 

// ---------- CUSTOMER ADDRESSES PAGE ----------

app.get('/employee-c_a',function(req,res,next){
  var context = {};
  // Allows the user to select 'all' from the dropdown to display all information in the Customer_Addresses table. 
  if(req.query.customer_id == 'all'){
      req.query.customer_id = '.*';
    }
  // Query that allows the user to search by customer_id from the Customer_Addresses table  
  mysql.pool.query('SELECT * FROM customer_addresses  WHERE customer_id REGEXP ?', [req.query.customer_id || '.*'], function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.c_a = rows;

  // Query that is used for the customers column in the table, so when entering new data the client can choose from existing customer_ids.
  mysql.pool.query('SELECT customer_id FROM customers', function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.customerdrop = rows;

  // Query that is used for the addresses column in the table, so when entering new data the client can choose from existing address_ids. 
  mysql.pool.query('SELECT address_id FROM addresses', function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.addressdrop = rows;

  // Query used for the dropdown search bar to allow the user to search by distinct customer_ids from the Customer_Addresses table. 
  mysql.pool.query('SELECT DISTINCT customer_id FROM customer_addresses', function(err,rows,fields){
    if(err){
      next(err);
      return;
    }
    context.dropdown = rows;
    res.render('employee-c_a', context);
    });
  });
});
});
});

// Post request that allows the user to enter in new data to the Customer_Addresses table.
app.post('/create-customer-address', function(req, res) {
  mysql.pool.query('INSERT INTO customer_addresses (customer_id, address_id) VALUES (?, ?)',
  [req.body.customer_id, req.body.address_id],
  function (err) {
      if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
          console.log('A new entry cannot have the same customer_id and address_id as an existing entry.');
      }
      else {
          console.log('There has been an error of some sort');
      }}
  })
  res.redirect('/employee-c_a');
}); 

// ---------- LINE ITEMS PAGE ----------

app.get('/employee-line_items',function(req,res,next){
    var context = {};
    if(req.query.order_id == 'all'){
      req.query.order_id = '.*';
    }
    // Query that searches the Line_Items table by the order_id given.
    mysql.pool.query('SELECT * FROM line_items WHERE order_id REGEXP ?', [req.query.order_id || '.*'], function(err, rows, fields){
      if(err){
        next(err);
        return;
      }
      context.line = rows;

    // Used for the dropdown in the products column in the table.  This allows the user to choose from existing product_ids in the Products table. 
    mysql.pool.query('SELECT product_id FROM products', function(err, rows, fields){
      if(err){
        next(err);
        return;
      }
      context.proddrop = rows;

    // Used for the dropdown in the orders column in the table.  This allows the user to choose from existing order_ids in the Orders table. 
    mysql.pool.query('SELECT order_id FROM orders', function(err, rows, fields){
      if(err){
        next(err);
        return;
      }
      context.orderdrop = rows;

    // Used for the search dropdown and will display distinct order_ids from the Line_Items table. 
    mysql.pool.query('SELECT DISTINCT order_id FROM line_items', function(err, rows, fields){
      if(err){
        next(err);
        return;
      }
      context.dropdown = rows;
      res.render('employee-line_items', context);
      });
    });
  });
  });
});

// Post request used to add new information into the Line_Items table.
app.post('/create-line-item', function(req, res) {
    mysql.pool.query('INSERT INTO line_items (order_id, product_id, line_item_cost, quantity) VALUES (?, ?, ?, ?)',
    [req.body.order_id, req.body.product_id, req.body.line_item_cost, req.body.quantity],
    function (err) {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
            console.log('A new entry cannot have the same order_id and product_id as an existing entry.');
        }
        else {
            console.log('There has been an error of some sort.');
        }}
    })
    res.redirect('/employee-line_items');
}); 

// ---------- ERROR PAGES ----------

app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});

// ---------- LOADS UP WEBSITE ----------

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
