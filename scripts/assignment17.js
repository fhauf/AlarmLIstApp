const note = document.getElementById('notifications');

// create an instance of a db object for us to store the IDB data in
let db;

// create a blank instance of the object that is used to transfer data into the IDB. This is mainly for reference
let newItem = [
      { Title: "", hours: 0, minutes: 0, day: 0, month: "", year: 0, notified: "no" }
    ];

// all the variables we need for the app
const alarmList = document.getElementById('alarm-list');

const alarmForm = document.getElementById('alarm-form');
const title = document.getElementById('title');

const hours = document.getElementById('alarm-hours');
const minutes = document.getElementById('alarm-minutes');
const day = document.getElementById('alarm-day');
const month = document.getElementById('alarm-month');
const year = document.getElementById('alarm-year');

const submit = document.getElementById('submit');

const notificationBtn = document.getElementById('enable');

// Do an initial check to see what the notification permission state is
if(Notification.permission === 'denied' || Notification.permission === 'default') {
  notificationBtn.style.display = 'block';
} else {
  notificationBtn.style.display = 'none';
}

window.onload = function() {
  note.innerHTML += '<li>App initialised.</li>';
  // Include the prefixes of implementations you want to test.
  window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  // Open the database
  const DBOpenRequest = window.indexedDB.open("alarmList", 4);

  // these two event handlers act on the database being opened successfully, or not
  DBOpenRequest.onerror = function(event) {
    note.innerHTML += '<li>Error loading database.</li>';
  };

  DBOpenRequest.onsuccess = function(event) {
    note.innerHTML += '<li>Database initialised.</li>';

    // store the result of opening the database in the db variable. This is used a lot below
    db = DBOpenRequest.result;

    // Run the displayData() function to populate the alarm list with all the alarm list data already in the IDB
    displayData();
  };

  // This event handles the event whereby a new version of the database needs to be created
  // Either one has not been created before, or a new version number has been submitted via the
  // window.indexedDB.open line above
  //it is only implemented in recent browsers
  DBOpenRequest.onupgradeneeded = function(event) {
    let db = event.target.result;

    db.onerror = function(event) {
      note.innerHTML += '<li>Error loading database.</li>';
    };

    // Create an objectStore for this database

    let objectStore = db.createObjectStore("alarmList", { keyPath: "alarmTitle" });

    // define what data items the objectStore will contain

    objectStore.createIndex("hours", "hours", { unique: false });
    objectStore.createIndex("minutes", "minutes", { unique: false });
    objectStore.createIndex("day", "day", { unique: false });
    objectStore.createIndex("month", "month", { unique: false });
    objectStore.createIndex("year", "year", { unique: false });

    objectStore.createIndex("notified", "notified", { unique: false });

    note.innerHTML += '<li>Object store created.</li>';
  };

  function displayData() {
    // first clear the content of the alarm list so that you don't get a huge long list of duplicate stuff each time the display is updated.
    alarmList.innerHTML = "";

    // Open our object store and then get a cursor list of all the different data items in the IDB to iterate through
    let objectStore = db.transaction('alarmList').objectStore('alarmList');
    objectStore.openCursor().onsuccess = function(event) {
      let cursor = event.target.result;
        // if there is still another cursor to go, keep running this code
        if(cursor) {
          // create a list item to put each data item inside when displaying it
          const listItem = document.createElement('li');

          // check which suffix the alarm day of the month needs
          if(cursor.value.day == 1 || cursor.value.day == 21 || cursor.value.day == 31) {
            daySuffix = "st";
          } else if(cursor.value.day == 2 || cursor.value.day == 22) {
            daySuffix = "nd";
          } else if(cursor.value.day == 3 || cursor.value.day == 23) {
            daySuffix = "rd";
          } else {
            daySuffix = "th";
          }

          // build the alarm list entry and put it into the list item via innerHTML.
          listItem.innerHTML = cursor.value.alarmTitle + ' — ' + cursor.value.hours + ':' + cursor.value.minutes + ', ' + cursor.value.month + ' ' + cursor.value.day + daySuffix + ' ' + cursor.value.year + '.';

          if(cursor.value.notified == "yes") {
            listItem.style.textDecoration = "line-through";
            listItem.style.color = "rgba(255,0,0,0.5)";
          }

          // put the item item inside the task list
          alarmList.appendChild(listItem);

          // create a delete button inside each list item, giving it an event handler so that it runs the deleteButton()
          // function when clicked
          const deleteButton = document.createElement('button');
          listItem.appendChild(deleteButton);
          deleteButton.innerHTML = 'X';
          // here we are setting a data attribute on our delete button to say what task we want deleted if it is clicked!
          deleteButton.setAttribute('data-task', cursor.value.alarmTitle);
          deleteButton.onclick = function(event) {
            deleteItem(event);
          }

          // continue on to the next item in the cursor
          cursor.continue();

        // if there are no more cursor items to iterate through, say so, and exit the function
        } else {
          note.innerHTML += '<li>Alarm entries all displayed.</li>';
        }
      }
    }

  // give the form submit button an event listener so that when the form is submitted the addData() function is run
  alarmForm.addEventListener('submit',addData,false);

  function addData(e) {
    // prevent default - we don't want the form to submit in the conventional way
    e.preventDefault();

    // Stop the form submitting if any values are left empty. This is just for browsers that don't support the HTML5 form
    // required attributes
    if(title.value == '' || hours.value == null || minutes.value == null || day.value == '' || month.value == '' || year.value == null) {
      note.innerHTML += '<li>Data not submitted — form incomplete.</li>';
      return;
    } else {

      // grab the values entered into the form fields and store them in an object ready for being inserted into the IDB
      let newItem = [
        { alarmTitle: title.value, hours: hours.value, minutes: minutes.value, day: day.value, month: month.value, year: year.value, notified: "no" }
      ];

      // open a read/write db transaction, ready for adding the data
      let transaction = db.transaction(["alarmList"], "readwrite");

      // report on the success of the transaction completing, when everything is done
      transaction.oncomplete = function() {
        note.innerHTML += '<li>Transaction completed: database modification finished.</li>';

        // update the display of data to show the newly added alarm, by running displayData() again.
        displayData();
      };

      transaction.onerror = function() {
        note.innerHTML += '<li>Transaction not opened due to error: ' + transaction.error + '</li>';
      };

      // call an object store that's already been added to the database
      let objectStore = transaction.objectStore("alarmList");
      console.log(objectStore.indexNames);
      console.log(objectStore.keyPath);
      console.log(objectStore.name);
      console.log(objectStore.transaction);
      console.log(objectStore.autoIncrement);

      // Make a request to add our newItem object to the object store
      let objectStoreRequest = objectStore.add(newItem[0]);
        objectStoreRequest.onsuccess = function(event) {

          // report the success of our request
          note.innerHTML += '<li>Request successful.</li>';

          // clear the form, ready for adding the next entry
          title.value = '';
          hours.value = null;
          minutes.value = null;
          day.value = 04;
          month.value = 'June';
          year.value = 2021;

        };

      };

    };

  function deleteItem(event) {
    // retrieve the name of the alarm we want to delete
    let dataTask = event.target.getAttribute('data-task');

    // open a database transaction and delete the alarm, finding it by the name we retrieved above
    let transaction = db.transaction(["alarmList"], "readwrite");
    let request = transaction.objectStore("alarmList").delete(dataTask);

    // report that the alarm has been deleted
    transaction.oncomplete = function() {
      // delete the parent of the button, which is the list item, so it no longer is displayed
      event.target.parentNode.parentNode.removeChild(event.target.parentNode);
      note.innerHTML += '<li>Task \"' + dataTask + '\" deleted.</li>';
    };
  };

  // this function checks whether the time for each alarm has arrived or not, and responds appropriately
  function checkAlarmTimes() {
    // First of all check whether notifications are enabled or denied
    if(Notification.permission === 'denied' || Notification.permission === 'default') {
      notificationBtn.style.display = 'block';
    } else {
      notificationBtn.style.display = 'none';
    }

    // grab the time and date right now
    const now = new Date();

    // from the now variable, store the current minutes, hours, day of the month and seconds
    const minuteCheck = now.getMinutes();
    const hourCheck = now.getHours();
    const dayCheck = now.getDate();
    const monthCheck = now.getMonth();
    const yearCheck = now.getFullYear();

    // again, open a transaction then a cursor to iterate through all the data items in the IDB
    let objectStore = db.transaction(['alarmList'], "readwrite").objectStore('alarmList');
    objectStore.openCursor().onsuccess = function(event) {
      let cursor = event.target.result;
        if(cursor) {

        // convert the month names we have installed in the IDB into a month number that JavaScript will understand.
        // The JavaScript date object creates month values as a number between 0 and 11.
        switch(cursor.value.month) {
          case "January":
            var monthNumber = 0;
            break;
          case "February":
            var monthNumber = 1;
            break;
          case "March":
            var monthNumber = 2;
            break;
          case "April":
            var monthNumber = 3;
            break;
          case "May":
            var monthNumber = 4;
            break;
          case "June":
            var monthNumber = 5;
            break;
          case "July":
            var monthNumber = 6;
            break;
          case "August":
            var monthNumber = 7;
            break;
          case "September":
            var monthNumber = 8;
            break;
          case "October":
            var monthNumber = 9;
            break;
          case "November":
            var monthNumber = 10;
            break;
          case "December":
            var monthNumber = 11;
            break;
          default:
          alert('Incorrect month entered in database.');
        }
          // check if the current hours, minutes, day, month and year values match the stored values for each task in the IDB.
          // The + operator in this case converts numbers with leading zeros into their non leading zero equivalents, so e.g.
          // 09 -> 9. This is needed because JS date number values never have leading zeros, but our data might.
          // The secondsCheck = 0 check is so that you don't get duplicate notifications for the same task. The notification
          // will only appear when the seconds is 0, meaning that you won't get more than one notification for each task
          console.log(`Alarm time: hours = ${cursor.value.hours}, minutes = ${cursor.value.minutes}, day = ${cursor.value.day}, month = ${monthNumber}, year = ${cursor.value.year}`);
          if(+(cursor.value.hours) == hourCheck && +(cursor.value.minutes) == minuteCheck && +(cursor.value.day) == dayCheck && monthNumber == monthCheck && cursor.value.year == yearCheck && cursor.value.notified == "no") {

            // If the numbers all do match, run the createNotification() function to create a system notification
            // but only if the permission is set

            if(Notification.permission === 'granted') {
              createNotification(cursor.value.taskTitle);
            }
          }

          // move on and perform the same deadline check on the next cursor item
          cursor.continue();
        }

    }

  }

  // askNotificationPermission function to ask for permission when the "Enable notifications" button is clicked
  function askNotificationPermission() {
    // function to actually ask the permissions
    function handlePermission(permission) {
      console.log(`In handlePermission(), permission is ${permission}`);
      Notification.permission = permission;
      console.log(`Permission is ${Notification.permission}`);
     
      // set the button to shown or hidden, depending on what the user answers
      if(Notification.permission === 'denied' || Notification.permission === 'default') {
        console.log(`Response is ${Notification.permission}, setting button style to block`);
        notificationBtn.style.display = 'block';
      } else {
        console.log("Setting button style to none");
        notificationBtn.style.display = 'none';
      }
    }
    
    Notification.requestPermission()
      .then((permission) => {
          console.log(`Result of calling Notification.requestPermission() is ${permission}`);
          handlePermission(permission);
      })
  }

  // wire up notification permission functionality to "Enable notifications" button
  notificationBtn.addEventListener('click', askNotificationPermission);

  // function for creating the notification
  function createNotification(title) {

    // Create and show the notification
    let img = '/Assignment 17/img/alarmclock.png';
    let text = `ATTENTION! ${title} has alarmed.`;
    let notification = new Notification('Alarm List', { body: text, icon: img });

    // we need to update the value of notified to "yes" in this particular data object, so the
    // notification won't be set off on it again

    // first open up a transaction as usual
    let objectStore = db.transaction(['alarmList'], "readwrite").objectStore('alarmList');

    // get the alarm list object that has this title as its title
    let objectStoreTitleRequest = objectStore.get(title);

    objectStoreTitleRequest.onsuccess = function() {
      // grab the data object returned as the result
      let data = objectStoreTitleRequest.result;

      // update the notified value in the object to "yes"
      data.notified = "yes";

      // create another request that inserts the item back into the database
      let updateTitleRequest = objectStore.put(data);

      // when this new request succeeds, run the displayData() function again to update the display
      updateTitleRequest.onsuccess = function() {
        displayData();
      }
    }
  }

  // using a setInterval to run the checkAlarmTimes() function every second
  setInterval(checkAlarmTimes, 1000);
}
