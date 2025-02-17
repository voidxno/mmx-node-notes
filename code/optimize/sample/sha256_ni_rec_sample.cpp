/*
 * sha256_ni_rec_sample.cpp
 *
 *  Created on: Feb 17, 2025
 *      Author: mad, voidxno
 *
 *  NOTE: Educational sample elements of static nature that can be done. Not whole file.
 */

// <cut-start>

 //...

	alignas(64)
	static const uint32_t K64[64] = {
		0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
		0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
		0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
		0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
		0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
		0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
		0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
		0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
		0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
		0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
		0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
		0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
		0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
		0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
		0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
		0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
	};

	// shuffle mask
	const __m128i SHUF_MASK = _mm_set_epi64x(0x0c0d0e0f08090a0b,0x0405060700010203);

	// init values
	const __m128i ABEF_INIT = _mm_set_epi64x(0x6a09e667bb67ae85,0x510e527f9b05688c);
	const __m128i CDGH_INIT = _mm_set_epi64x(0x3c6ef372a54ff53a,0x1f83d9ab5be0cd19);

	// pre-calc/cache padding
	const __m128i HPAD0_CACHE = _mm_set_epi64x(0x0000000000000000,0x0000000080000000);
	const __m128i HPAD1_CACHE = _mm_set_epi64x(0x0000010000000000,0x0000000000000000);

	//-- pre-calc/static values
	const __m128i MORE0_CACHE = _mm_set_epi64x(0x5807AA985807AA98,0x550C7DC3243185BE);
	const __m128i MORE1_CACHE = _mm_set_epi64x(0x0000000000000000,0x0000000000000000);
	const __m128i MORE2_CACHE = _mm_set_epi64x(0x550C7DC3243185BE,0x12835B015807AA98);
	const __m128i MORE3_CACHE = _mm_set_epi64x(0xC19BF2749BDC06A7,0x80DEB1FE72BE5D74);

	__m128i STATE0;
	__m128i STATE1;
	__m128i MSG;
	__m128i MSGTMP0;
	__m128i MSGTMP1;
	__m128i MSGTMP2;
	__m128i MSGTMP3;

	// init/shuffle hash
	__m128i HASH0_SAVE = _mm_loadu_si128(reinterpret_cast<__m128i*>(&hash[0]));
	__m128i HASH1_SAVE = _mm_loadu_si128(reinterpret_cast<__m128i*>(&hash[16]));
	HASH0_SAVE = _mm_shuffle_epi8(HASH0_SAVE,SHUF_MASK);
	HASH1_SAVE = _mm_shuffle_epi8(HASH1_SAVE,SHUF_MASK);

	for(uint64_t i = 0; i < num_iters; ++i) {

		// init state
		STATE0 = ABEF_INIT;
		STATE1 = CDGH_INIT;

		// rounds 0-3
		MSG = HASH0_SAVE;
		MSGTMP0 = MSG;
		MSG = _mm_add_epi32(MSG,_mm_load_si128(reinterpret_cast<const __m128i*>(&K64[0])));
		STATE1 = _mm_sha256rnds2_epu32(STATE1,STATE0,MSG);
		MSG = _mm_shuffle_epi32(MSG,0x0E);
		STATE0 = _mm_sha256rnds2_epu32(STATE0,STATE1,MSG);

		// rounds 4-7
		MSG = HASH1_SAVE;
		MSGTMP1 = MSG;
		MSG = _mm_add_epi32(MSG,_mm_load_si128(reinterpret_cast<const __m128i*>(&K64[4])));
		STATE1 = _mm_sha256rnds2_epu32(STATE1,STATE0,MSG);
		MSG = _mm_shuffle_epi32(MSG,0x0E);
		STATE0 = _mm_sha256rnds2_epu32(STATE0,STATE1,MSG);
		MSGTMP0 = _mm_sha256msg1_epu32(MSGTMP0,MSGTMP1);

		// rounds 8-11
		MSG = HPAD0_CACHE;
		MSGTMP2 = MSG;
		/* (SAMPLE01) */ // MSG = _mm_add_epi32(MSG,_mm_load_si128(reinterpret_cast<const __m128i*>(&K64[8])));
		/* (SAMPLE01) */ // MSG = _mm_add_epi32(HPAD0_CACHE,_mm_load_si128(reinterpret_cast<const __m128i*>(&K64[8])));
		/* (SAMPLE01) */ MSG = MORE2_CACHE;
		STATE1 = _mm_sha256rnds2_epu32(STATE1,STATE0,MSG);
		/* (SAMPLE02) */ // MSG = _mm_shuffle_epi32(MSG,0x0E);
		/* (SAMPLE02) */ // MSG = _mm_shuffle_epi32(MORE2_CACHE,0x0E);
		/* (SAMPLE02) */ MSG = MORE0_CACHE;
		STATE0 = _mm_sha256rnds2_epu32(STATE0,STATE1,MSG);
		MSGTMP1 = _mm_sha256msg1_epu32(MSGTMP1,MSGTMP2);

		// rounds 12-15
		MSG = HPAD1_CACHE;
		MSGTMP3 = MSG;
		/* (SAMPLE03) */ // MSG = _mm_add_epi32(MSG,_mm_load_si128(reinterpret_cast<const __m128i*>(&K64[12])));
		/* (SAMPLE03) */ // MSG = _mm_add_epi32(HPAD1_CACHE,_mm_load_si128(reinterpret_cast<const __m128i*>(&K64[12])));
		/* (SAMPLE03) */ MSG = MORE3_CACHE;
		STATE1 = _mm_sha256rnds2_epu32(STATE1,STATE0,MSG);
		/* (SAMPLE04) */ // MSGTMP0 = _mm_add_epi32(MSGTMP0,_mm_alignr_epi8(MSGTMP3,MSGTMP2,4));
		/* (SAMPLE04) */ // MSGTMP0 = _mm_add_epi32(MSGTMP0,_mm_alignr_epi8(HPAD1_CACHE,HPAD0_CACHE,4));
		/* (SAMPLE04) */ MSGTMP0 = _mm_add_epi32(MSGTMP0,MORE1_CACHE);
		MSGTMP0 = _mm_sha256msg2_epu32(MSGTMP0,MSGTMP3);
		MSG = _mm_shuffle_epi32(MSG,0x0E);
		STATE0 = _mm_sha256rnds2_epu32(STATE0,STATE1,MSG);
		/* (SAMPLE05) */ // MSGTMP2 = _mm_sha256msg1_epu32(MSGTMP2,MSGTMP3);
		/* (SAMPLE05) */ // MSGTMP2 = _mm_sha256msg1_epu32(HPAD0_CACHE,HPAD1_CACHE);
		/* (SAMPLE05) */ MSGTMP2 = HPAD0_CACHE;

 //...

// <cut-end>
