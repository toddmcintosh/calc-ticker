<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TickerController;

Route::get('/ticker/data', [TickerController::class, 'index']);

Route::post('/ticker', [TickerController::class, 'store']);

Route::delete('/ticker/all', [TickerController::class, 'destroyAll']);

Route::delete('/ticker/{id}', [TickerController::class, 'destroy']);
