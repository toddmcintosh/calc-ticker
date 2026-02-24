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

    /**
     * Test creating single ticker successfully
     */
    public function test_create_single_ticker(): void
    {
        $res = $this->createSingleTicker();
        $res->assertCreated();
        $data = $res->json('data');
        $this->assertEquals('8', $data['solution']);
    }

    /**
     * Test returning all tickers successfully
     */
    public function test_return_all_tickers(): void
    {
        $res = $this->getJson('/api/ticker/data');
        $data = $res->json('data');
        $this->assertIsArray($res->json('data'));
        $this->assertEquals('1', $data[0]['id']);
        $this->assertEquals('3', count($data));
    }

    /**
     * Testing single ticker deletion successfully
     */
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

    /**
     * Testing all tickers deletion successfully
     */
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

    /**
     * Testing empty expression input validation
     */
    public function test_store_requires_expression(): void
    {
        $res = $this->postJson('/api/ticker', []);
        $res->assertStatus(422); // validation error
        $res->assertJsonValidationErrors(['expression']);
    }

    /**
     * Testing 400 response on invalid expression input
     */
    public function test_store_returns_400_on_invalid_expression(): void
    {
        $res = $this->postJson('/api/ticker', [
            'expression' => '1 + a', // MathEngine::guard will throw InvalidArgumentException
        ]);

        $res->assertStatus(400);
        $this->assertNull($res->json('data'));
        $this->assertNotNull($res->json('error'));
        $this->assertStringContainsString('Invalid', $res->json('error'));
    }

    /**
     * Testing 404 response when deleting non-existing ticker
     */
    public function test_delete_returns_404_when_not_found(): void
    {
        $res = $this->deleteJson('/api/ticker/999999');
        $res->assertStatus(404);
        $this->assertNull($res->json('data'));
        $this->assertEquals('Not found', $res->json('error'));
    }
}
