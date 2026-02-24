<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class TokenizerTest extends TestCase
{
    /**
     * Testing input of unary minus in expression
     */
    public function test_tokenizer_unary_minus(): void
    {
        $tokenizer = app(\App\Math\Tokenizer::class);
        $expression = '-4+4';
        $tokens = $tokenizer->tokenize($expression);
        $this->assertEquals([0.0, '-', 4.0, '+', 4.0], $tokens);
    }
}
