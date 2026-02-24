<?php

namespace Tests\Unit;

use App\Math\RpnEvaluator;
use PHPUnit\Framework\TestCase;

class RpnTest extends TestCase
{
    /**
     * Simple one operator test
     */
    public function test_rpn_evaluate(): void
    {
        $rpn = app(RpnEvaluator::class);
        $rpnExpression = [4.0, 4.0, '+'];
        $solution = $rpn->evaluate($rpnExpression);
        $this->assertEquals(8.0, $solution);
    }
    /**
     * Testing input of invalid operator
     */
    public function test_rpn_evaluate_invalid_operator(): void
    {
        $rpn = app(RpnEvaluator::class);
        $rpnExpression = [4.0, 4.0, '&'];
        $this->expectException(\InvalidArgumentException::class);
        $rpn->evaluate($rpnExpression);
    }
}
