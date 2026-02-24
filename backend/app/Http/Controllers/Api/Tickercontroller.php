<?php

namespace App\Http\Controllers\Api;

use App\Models\TickerItem;
use Illuminate\Http\Request;
use App\Math\MathEngine;

class TickerController
{
    /**
     ** GET /api/ticker/data
     ** Return an array of all TickerItems
     **/
    public function index()
    {
        return response()->json([
            'data' => TickerItem::query()->orderBy('id')->get(['id', 'expression', 'solution', 'created_at']),
            'error' => null,
        ]);
    }

    /**
     ** POST /api/ticker
     ** Accept expression string, calc solution and return
     **/
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'expression' => ['required', 'string', 'max:255'],
            ]);

            $expression = $validated['expression'];
            $engine = app(MathEngine::class);
            $solution = $engine->evaluate($expression);

            $item = TickerItem::create([
                'expression' => $expression,
                'solution' => $solution,
            ]);

            return response()->json([
                'data' => [
                    'id' => $item->id,
                    'expression' => $item->expression,
                    'solution' => $item->solution,
                ],
                'error' => null,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['data' => null, 'error' => $e->getMessage()], 400);
        }
    }

    /**
     ** DELETE /api/ticker/{id}
     ** Accept TickerItem Id and delete one item, return success status
     **/
    public function destroy(int $id)
    {
        $item = TickerItem::find($id);
        if (!$item) {
            return response()->json(['data' => null, 'error' => 'Not found'], 404);
        }

        $item->delete();

        return response()->json(['data' => ['deleted' => true, 'id' => $id], 'error' => null]);
    }

    /**
     ** DELETE /api/ticker/all
     ** Delete all TickerItems and return success status
     **/
    public function destroyAll()
    {
        TickerItem::query()->delete();

        return response()->json(['data' => ['deleted_all' => true], 'error' => null]);
    }
}
