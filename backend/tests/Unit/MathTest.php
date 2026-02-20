<?php

namespace Tests\Unit;

use App\Math\MathEngine;
use PHPUnit\Framework\TestCase;

class MathTest extends TestCase
{
    /**
     * Simple one operator test
     */
    public function test_calc_is_correct_one_operator(): void
    {
        $expression = '4+4';
        $engine = app(MathEngine::class);
        $solution = $engine->evaluate($expression);

        $this->assertEquals('8', $solution);
    }
    /**
     * Multiple operator test
     */
    public function test_calc_is_correct_multiple_operators(): void
    {
        $expression = '4+4*2-4/2';
        $engine = app(MathEngine::class);
        $solution = $engine->evaluate($expression);

        $this->assertEquals('10', $solution);
    }
    /**
     * Advanced operator test
     */
    public function test_calc_is_correct_advanced_operators(): void
    {
        $expression = 'sqrt((((9*9)/12)+(13-4))*2)^2';
        $engine = app(MathEngine::class);
        $solution = $engine->evaluate($expression);

        $this->assertEquals('31.5', $solution);
    }
}
