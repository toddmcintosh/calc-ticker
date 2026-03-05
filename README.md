# CALC TICKER

Demo created for a job application with a prospective employer. Direction given was to create an app with a Vue frontend and Laravel backend. The front end would house a calculator component that would allow different types of calculations including complex nested expresssions. Calculations were processed on the Laravel backend via API calls. 

This was an interesting project because it required implementing the [Shunting Yard](https://en.wikipedia.org/wiki/Shunting_yard_algorithm) algorithm, along with [Reverse Polish Notation](https://en.wikipedia.org/wiki/Reverse_Polish_notation) in order to process the nested expressions.



### SETUP STEPS

<img src="calcticker_screenshot.png" alt="Diagram" width="300">

1. Setup Backend

- cd backend
- composer install
- cp .env.example .env
- add to .env:
  - DB_CONNECTION=sqlite
  - DB_DATABASE=database/database.sqlite
- php artisan key:generate
- touch database/database.sqlite
- php artisan migrate
- php artisan serve --port=3500
- #backend runs on localhost:3500

2. Setup Frontend

- cd frontend
- npm install && npm run dev
- #frontend runs on localhost:5173

3. Tests

- cd backend
- php artisan test
- cd frontend
- npm run test:unit
