<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TickerControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function createSingleTicker()
    {
        $res = $this->postJson('/api/ticker', [
            'expression' => '4+4',
        ]);
        return $res;
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSingleTicker();
        $this->createSingleTicker();
        $this->createSingleTicker();
    }

    public function test_create_single_ticker(): void
    {
        $res = $this->createSingleTicker();
        $res->assertCreated();
        $data = $res->json('data');
        $this->assertEquals('8', $data['solution']);
    }

    public function test_return_all_tickers(): void
    {
        $res = $this->getJson('/api/ticker/data');
        $data = $res->json('data');
        $this->assertIsArray($res->json('data'));
        $this->assertEquals('1', $data[0]['id']);
        $this->assertEquals('3', count($data));
    }

    public function test_delete_one_ticker(): void
    {
        //delete one ticker
        $res = $this->deleteJson('/api/ticker/1');
        $data = $res->json('data');
        $this->assertIsArray($res->json('data'));
        $this->assertEquals('1', $data['deleted']);

        //get all remaining tickers
        $res2 = $this->getJson('/api/ticker/data');
        $data2 = $res2->json('data');
        $this->assertEquals('2', $data2[0]['id']);
        $this->assertEquals('2', count($data2));
    }

    public function test_delete_all_tickers(): void
    {
        //delete one ticker
        $res = $this->deleteJson('/api/ticker/all');
        $data = $res->json('data');
        $this->assertIsArray($res->json('data'));
        $this->assertEquals(True, $data['deleted_all']);

        //get all remaining tickers
        $res2 = $this->getJson('/api/ticker/data');
        $data2 = $res2->json('data');
        $this->assertEquals('0', count($data2));
    }
}
