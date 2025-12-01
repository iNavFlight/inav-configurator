import{ad as va,ae as Ut,af as Jt,w as Ge,ag as Ea,ah as dt,ai as qn,ac as wt,aj as Ur,ak as vi,al as en,am as tt,an as Gt,ao as bn,ap as Xt,aq as xt,ar as Et,as as tn,a2 as Fe,at as mt,au as Sa,av as Ta,a7 as ct,v as fn,aw as Ma,ax as Un,ay as bt,az as xn,aA as li,aB as dn,aC as pn,aD as Ir,aE as xa,aF as $t,aG as An,aH as Aa,aI as Ra,aJ as on,aK as Ca,aL as ba,aM as La,aN as Pa,aO as wa,aP as Da,aQ as Ua,aR as Ia,aS as Na,aT as ya,aU as Oa,aV as Fa,aW as Ba,aX as Ha,aY as Ga,aZ as Nr,a_ as yr,a$ as Rn,b0 as Sn,b1 as Lt,b2 as cn,b3 as Or,b4 as kt,b5 as Va,b6 as ka,b7 as za,b8 as Wa,b9 as Fr,ba as Xa,bb as Ka,bc as Ya,a9 as qa,bd as He,be as $a,bf as Za,bg as ja,bh as Kt,bi as fi,bj as zt,bk as Pt,bl as Br,bm as Wt,bn as Ct,bo as Cn,bp as Hr,bq as Gr,br as Vr,bs as kr,bt as Qa,bu as Ja,bv as eo,bw as to,bx as zr,by as Vt,bz as no,bA as io,bB as ro,bC as Wr,bD as ao,bE as Xr,bF as Kr,bG as In,bH as Nn,bI as yn,bJ as On,bK as qe,bL as Ei,bM as Si,bN as Ti,bO as Mi,bP as xi,bQ as Ai,bR as Ri,bS as Ci,bT as bi,bU as Li,bV as Pi,bW as wi,bX as Di,bY as Ui,bZ as Ii,b_ as Ni,b$ as yi,c0 as Oi,c1 as Fi,c2 as Bi,c3 as Hi,c4 as Gi,c5 as Vi,c6 as ki,c7 as zi,c8 as Wi,c9 as Xi,ca as Ki,cb as $n,cc as Zn,cd as jn,ce as Qn,cf as Jn,cg as ei,ch as ti,ci as oo,cj as Yi,ck as so,cl as Tn,cm as co,cn as qi,co as $i,cp as Zi,cq as ni,cr as ii,cs as lo,ct as Yr,cu as fo,cv as ut,cw as Ln,cx as uo,cy as po,cz as qr,cA as $r,cB as ji,ab as Zr,cC as Qi,cD as jr,cE as hn,cF as nn,cG as Qr,cH as Zt,cI as ho,cJ as mo,cK as _o,cL as Ji,cM as go,cN as vo,cO as Eo,cP as So,cQ as To,cR as Mo,cS as xo,cT as Ao,cU as Ro,cV as Co,cW as bo,cX as ri,cY as Lo,cZ as Po,c_ as wo,c$ as Do,d0 as Uo,d1 as Io,d2 as No,d3 as ai,d4 as Jr,d5 as yo,d6 as un,d7 as ea,d8 as At,d9 as Oo,da as Fo,D as Bo,db as Ho,a5 as ta,dc as Go,O as na,dd as Vo,de as ko,df as zo,dg as Wo,dh as Fn,di as Xo,dj as ia,dk as Ko,dl as Yo,dm as qo,dn as $o,dp as Zo,dq as jo,dr as Bn,aa as Qo,ds as Jo,dt as es,du as ts,dv as ns,dw as ra,dx as is,dy as er,dz as tr,dA as nr,dB as rs,dC as as,dD as os}from"./index--BqaKNiR.js";/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function aa(){let e=null,n=!1,t=null,i=null;function r(a,o){t(a,o),i=e.requestAnimationFrame(r)}return{start:function(){n!==!0&&t!==null&&(i=e.requestAnimationFrame(r),n=!0)},stop:function(){e.cancelAnimationFrame(i),n=!1},setAnimationLoop:function(a){t=a},setContext:function(a){e=a}}}function ss(e){const n=new WeakMap;function t(s,l){const u=s.array,m=s.usage,h=u.byteLength,_=e.createBuffer();e.bindBuffer(l,_),e.bufferData(l,u,m),s.onUploadCallback();let S;if(u instanceof Float32Array)S=e.FLOAT;else if(typeof Float16Array<"u"&&u instanceof Float16Array)S=e.HALF_FLOAT;else if(u instanceof Uint16Array)s.isFloat16BufferAttribute?S=e.HALF_FLOAT:S=e.UNSIGNED_SHORT;else if(u instanceof Int16Array)S=e.SHORT;else if(u instanceof Uint32Array)S=e.UNSIGNED_INT;else if(u instanceof Int32Array)S=e.INT;else if(u instanceof Int8Array)S=e.BYTE;else if(u instanceof Uint8Array)S=e.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)S=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:_,type:S,bytesPerElement:u.BYTES_PER_ELEMENT,version:s.version,size:h}}function i(s,l,u){const m=l.array,h=l.updateRanges;if(e.bindBuffer(u,s),h.length===0)e.bufferSubData(u,0,m);else{h.sort((S,D)=>S.start-D.start);let _=0;for(let S=1;S<h.length;S++){const D=h[_],C=h[S];C.start<=D.start+D.count+1?D.count=Math.max(D.count,C.start+C.count-D.start):(++_,h[_]=C)}h.length=_+1;for(let S=0,D=h.length;S<D;S++){const C=h[S];e.bufferSubData(u,C.start*m.BYTES_PER_ELEMENT,m,C.start,C.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(s){return s.isInterleavedBufferAttribute&&(s=s.data),n.get(s)}function a(s){s.isInterleavedBufferAttribute&&(s=s.data);const l=n.get(s);l&&(e.deleteBuffer(l.buffer),n.delete(s))}function o(s,l){if(s.isInterleavedBufferAttribute&&(s=s.data),s.isGLBufferAttribute){const m=n.get(s);(!m||m.version<s.version)&&n.set(s,{buffer:s.buffer,type:s.type,bytesPerElement:s.elementSize,version:s.version});return}const u=n.get(s);if(u===void 0)n.set(s,t(s,l));else if(u.version<s.version){if(u.size!==s.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(u.buffer,s,l),u.version=s.version}}return{get:r,remove:a,update:o}}var cs=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ls=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,fs=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,us=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ds=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ps=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,hs=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,ms=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,_s=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,gs=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,vs=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Es=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ss=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Ts=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ms=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,xs=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,As=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Rs=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Cs=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,bs=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Ls=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Ps=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,ws=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Ds=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Us=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Is=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Ns=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ys=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Os=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Fs=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Bs="gl_FragColor = linearToOutputTexel( gl_FragColor );",Hs=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Gs=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Vs=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,ks=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,zs=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ws=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Xs=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ks=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Ys=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,qs=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,$s=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Zs=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,js=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Qs=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Js=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,ec=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,tc=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,nc=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,ic=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,rc=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ac=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,oc=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,sc=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,cc=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lc=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,fc=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,uc=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,dc=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,pc=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,hc=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,mc=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,_c=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,gc=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,vc=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ec=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Sc=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Tc=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Mc=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xc=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Ac=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Rc=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Cc=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,bc=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Lc=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Pc=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,wc=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Dc=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Uc=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Ic=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Nc=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,yc=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Oc=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Fc=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Bc=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Hc=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Gc=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Vc=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,kc=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,zc=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Wc=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Xc=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Kc=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Yc=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,qc=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,$c=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Zc=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,jc=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Qc=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Jc=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,el=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,tl=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,nl=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,il=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,rl=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,al=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,ol=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const sl=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,cl=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ll=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,fl=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ul=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,dl=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,pl=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,hl=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,ml=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,_l=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,gl=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,vl=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,El=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Sl=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Tl=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Ml=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xl=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Al=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Rl=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Cl=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bl=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Ll=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Pl=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,wl=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Dl=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Ul=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Il=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Nl=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yl=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Ol=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Fl=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Bl=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Hl=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Gl=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ie={alphahash_fragment:cs,alphahash_pars_fragment:ls,alphamap_fragment:fs,alphamap_pars_fragment:us,alphatest_fragment:ds,alphatest_pars_fragment:ps,aomap_fragment:hs,aomap_pars_fragment:ms,batching_pars_vertex:_s,batching_vertex:gs,begin_vertex:vs,beginnormal_vertex:Es,bsdfs:Ss,iridescence_fragment:Ts,bumpmap_pars_fragment:Ms,clipping_planes_fragment:xs,clipping_planes_pars_fragment:As,clipping_planes_pars_vertex:Rs,clipping_planes_vertex:Cs,color_fragment:bs,color_pars_fragment:Ls,color_pars_vertex:Ps,color_vertex:ws,common:Ds,cube_uv_reflection_fragment:Us,defaultnormal_vertex:Is,displacementmap_pars_vertex:Ns,displacementmap_vertex:ys,emissivemap_fragment:Os,emissivemap_pars_fragment:Fs,colorspace_fragment:Bs,colorspace_pars_fragment:Hs,envmap_fragment:Gs,envmap_common_pars_fragment:Vs,envmap_pars_fragment:ks,envmap_pars_vertex:zs,envmap_physical_pars_fragment:ec,envmap_vertex:Ws,fog_vertex:Xs,fog_pars_vertex:Ks,fog_fragment:Ys,fog_pars_fragment:qs,gradientmap_pars_fragment:$s,lightmap_pars_fragment:Zs,lights_lambert_fragment:js,lights_lambert_pars_fragment:Qs,lights_pars_begin:Js,lights_toon_fragment:tc,lights_toon_pars_fragment:nc,lights_phong_fragment:ic,lights_phong_pars_fragment:rc,lights_physical_fragment:ac,lights_physical_pars_fragment:oc,lights_fragment_begin:sc,lights_fragment_maps:cc,lights_fragment_end:lc,logdepthbuf_fragment:fc,logdepthbuf_pars_fragment:uc,logdepthbuf_pars_vertex:dc,logdepthbuf_vertex:pc,map_fragment:hc,map_pars_fragment:mc,map_particle_fragment:_c,map_particle_pars_fragment:gc,metalnessmap_fragment:vc,metalnessmap_pars_fragment:Ec,morphinstance_vertex:Sc,morphcolor_vertex:Tc,morphnormal_vertex:Mc,morphtarget_pars_vertex:xc,morphtarget_vertex:Ac,normal_fragment_begin:Rc,normal_fragment_maps:Cc,normal_pars_fragment:bc,normal_pars_vertex:Lc,normal_vertex:Pc,normalmap_pars_fragment:wc,clearcoat_normal_fragment_begin:Dc,clearcoat_normal_fragment_maps:Uc,clearcoat_pars_fragment:Ic,iridescence_pars_fragment:Nc,opaque_fragment:yc,packing:Oc,premultiplied_alpha_fragment:Fc,project_vertex:Bc,dithering_fragment:Hc,dithering_pars_fragment:Gc,roughnessmap_fragment:Vc,roughnessmap_pars_fragment:kc,shadowmap_pars_fragment:zc,shadowmap_pars_vertex:Wc,shadowmap_vertex:Xc,shadowmask_pars_fragment:Kc,skinbase_vertex:Yc,skinning_pars_vertex:qc,skinning_vertex:$c,skinnormal_vertex:Zc,specularmap_fragment:jc,specularmap_pars_fragment:Qc,tonemapping_fragment:Jc,tonemapping_pars_fragment:el,transmission_fragment:tl,transmission_pars_fragment:nl,uv_pars_fragment:il,uv_pars_vertex:rl,uv_vertex:al,worldpos_vertex:ol,background_vert:sl,background_frag:cl,backgroundCube_vert:ll,backgroundCube_frag:fl,cube_vert:ul,cube_frag:dl,depth_vert:pl,depth_frag:hl,distanceRGBA_vert:ml,distanceRGBA_frag:_l,equirect_vert:gl,equirect_frag:vl,linedashed_vert:El,linedashed_frag:Sl,meshbasic_vert:Tl,meshbasic_frag:Ml,meshlambert_vert:xl,meshlambert_frag:Al,meshmatcap_vert:Rl,meshmatcap_frag:Cl,meshnormal_vert:bl,meshnormal_frag:Ll,meshphong_vert:Pl,meshphong_frag:wl,meshphysical_vert:Dl,meshphysical_frag:Ul,meshtoon_vert:Il,meshtoon_frag:Nl,points_vert:yl,points_frag:Ol,shadow_vert:Fl,shadow_frag:Bl,sprite_vert:Hl,sprite_frag:Gl},ie={common:{diffuse:{value:new Ge(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new He}},envmap:{envMap:{value:null},envMapRotation:{value:new He},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new He}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new He}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new He},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new He},normalScale:{value:new ct(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new He},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new He}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new He}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new He}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ge(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ge(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0},uvTransform:{value:new He}},sprite:{diffuse:{value:new Ge(16777215)},opacity:{value:1},center:{value:new ct(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}}},Mt={basic:{uniforms:ut([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.fog]),vertexShader:Ie.meshbasic_vert,fragmentShader:Ie.meshbasic_frag},lambert:{uniforms:ut([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,ie.lights,{emissive:{value:new Ge(0)}}]),vertexShader:Ie.meshlambert_vert,fragmentShader:Ie.meshlambert_frag},phong:{uniforms:ut([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,ie.lights,{emissive:{value:new Ge(0)},specular:{value:new Ge(1118481)},shininess:{value:30}}]),vertexShader:Ie.meshphong_vert,fragmentShader:Ie.meshphong_frag},standard:{uniforms:ut([ie.common,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.roughnessmap,ie.metalnessmap,ie.fog,ie.lights,{emissive:{value:new Ge(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag},toon:{uniforms:ut([ie.common,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.gradientmap,ie.fog,ie.lights,{emissive:{value:new Ge(0)}}]),vertexShader:Ie.meshtoon_vert,fragmentShader:Ie.meshtoon_frag},matcap:{uniforms:ut([ie.common,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,{matcap:{value:null}}]),vertexShader:Ie.meshmatcap_vert,fragmentShader:Ie.meshmatcap_frag},points:{uniforms:ut([ie.points,ie.fog]),vertexShader:Ie.points_vert,fragmentShader:Ie.points_frag},dashed:{uniforms:ut([ie.common,ie.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ie.linedashed_vert,fragmentShader:Ie.linedashed_frag},depth:{uniforms:ut([ie.common,ie.displacementmap]),vertexShader:Ie.depth_vert,fragmentShader:Ie.depth_frag},normal:{uniforms:ut([ie.common,ie.bumpmap,ie.normalmap,ie.displacementmap,{opacity:{value:1}}]),vertexShader:Ie.meshnormal_vert,fragmentShader:Ie.meshnormal_frag},sprite:{uniforms:ut([ie.sprite,ie.fog]),vertexShader:Ie.sprite_vert,fragmentShader:Ie.sprite_frag},background:{uniforms:{uvTransform:{value:new He},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ie.background_vert,fragmentShader:Ie.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new He}},vertexShader:Ie.backgroundCube_vert,fragmentShader:Ie.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ie.cube_vert,fragmentShader:Ie.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ie.equirect_vert,fragmentShader:Ie.equirect_frag},distanceRGBA:{uniforms:ut([ie.common,ie.displacementmap,{referencePosition:{value:new Fe},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ie.distanceRGBA_vert,fragmentShader:Ie.distanceRGBA_frag},shadow:{uniforms:ut([ie.lights,ie.fog,{color:{value:new Ge(0)},opacity:{value:1}}]),vertexShader:Ie.shadow_vert,fragmentShader:Ie.shadow_frag}};Mt.physical={uniforms:ut([Mt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new He},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new He},clearcoatNormalScale:{value:new ct(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new He},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new He},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new He},sheen:{value:0},sheenColor:{value:new Ge(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new He},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new He},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new He},transmissionSamplerSize:{value:new ct},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new He},attenuationDistance:{value:0},attenuationColor:{value:new Ge(0)},specularColor:{value:new Ge(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new He},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new He},anisotropyVector:{value:new ct},anisotropyMap:{value:null},anisotropyMapTransform:{value:new He}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag};const gn={r:0,b:0,g:0},yt=new Zr,Vl=new wt;function kl(e,n,t,i,r,a,o){const s=new Ge(0);let l=a===!0?0:1,u,m,h=null,_=0,S=null;function D(A){let M=A.isScene===!0?A.background:null;return M&&M.isTexture&&(M=(A.backgroundBlurriness>0?t:n).get(M)),M}function C(A){let M=!1;const N=D(A);N===null?c(s,l):N&&N.isColor&&(c(N,1),M=!0);const L=e.xr.getEnvironmentBlendMode();L==="additive"?i.buffers.color.setClear(0,0,0,1,o):L==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(e.autoClear||M)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function d(A,M){const N=D(M);N&&(N.isCubeTexture||N.mapping===Ln)?(m===void 0&&(m=new Pt(new $r(1,1,1),new Kt({name:"BackgroundCubeMaterial",uniforms:ji(Mt.backgroundCube.uniforms),vertexShader:Mt.backgroundCube.vertexShader,fragmentShader:Mt.backgroundCube.fragmentShader,side:Et,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),m.geometry.deleteAttribute("normal"),m.geometry.deleteAttribute("uv"),m.onBeforeRender=function(L,I,V){this.matrixWorld.copyPosition(V.matrixWorld)},Object.defineProperty(m.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(m)),yt.copy(M.backgroundRotation),yt.x*=-1,yt.y*=-1,yt.z*=-1,N.isCubeTexture&&N.isRenderTargetTexture===!1&&(yt.y*=-1,yt.z*=-1),m.material.uniforms.envMap.value=N,m.material.uniforms.flipEnvMap.value=N.isCubeTexture&&N.isRenderTargetTexture===!1?-1:1,m.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,m.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,m.material.uniforms.backgroundRotation.value.setFromMatrix4(Vl.makeRotationFromEuler(yt)),m.material.toneMapped=tt.getTransfer(N.colorSpace)!==qe,(h!==N||_!==N.version||S!==e.toneMapping)&&(m.material.needsUpdate=!0,h=N,_=N.version,S=e.toneMapping),m.layers.enableAll(),A.unshift(m,m.geometry,m.material,0,0,null)):N&&N.isTexture&&(u===void 0&&(u=new Pt(new kr(2,2),new Kt({name:"BackgroundMaterial",uniforms:ji(Mt.background.uniforms),vertexShader:Mt.background.vertexShader,fragmentShader:Mt.background.fragmentShader,side:tn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),Object.defineProperty(u.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(u)),u.material.uniforms.t2D.value=N,u.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,u.material.toneMapped=tt.getTransfer(N.colorSpace)!==qe,N.matrixAutoUpdate===!0&&N.updateMatrix(),u.material.uniforms.uvTransform.value.copy(N.matrix),(h!==N||_!==N.version||S!==e.toneMapping)&&(u.material.needsUpdate=!0,h=N,_=N.version,S=e.toneMapping),u.layers.enableAll(),A.unshift(u,u.geometry,u.material,0,0,null))}function c(A,M){A.getRGB(gn,qr(e)),i.buffers.color.setClear(gn.r,gn.g,gn.b,M,o)}function w(){m!==void 0&&(m.geometry.dispose(),m.material.dispose(),m=void 0),u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0)}return{getClearColor:function(){return s},setClearColor:function(A,M=1){s.set(A),l=M,c(s,l)},getClearAlpha:function(){return l},setClearAlpha:function(A){l=A,c(s,l)},render:C,addToRenderList:d,dispose:w}}function zl(e,n){const t=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},r=_(null);let a=r,o=!1;function s(g,P,B,X,K){let $=!1;const W=h(X,B,P);a!==W&&(a=W,u(a.object)),$=S(g,X,B,K),$&&D(g,X,B,K),K!==null&&n.update(K,e.ELEMENT_ARRAY_BUFFER),($||o)&&(o=!1,M(g,P,B,X),K!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,n.get(K).buffer))}function l(){return e.createVertexArray()}function u(g){return e.bindVertexArray(g)}function m(g){return e.deleteVertexArray(g)}function h(g,P,B){const X=B.wireframe===!0;let K=i[g.id];K===void 0&&(K={},i[g.id]=K);let $=K[P.id];$===void 0&&($={},K[P.id]=$);let W=$[X];return W===void 0&&(W=_(l()),$[X]=W),W}function _(g){const P=[],B=[],X=[];for(let K=0;K<t;K++)P[K]=0,B[K]=0,X[K]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:B,attributeDivisors:X,object:g,attributes:{},index:null}}function S(g,P,B,X){const K=a.attributes,$=P.attributes;let W=0;const ne=B.getAttributes();for(const G in ne)if(ne[G].location>=0){const Me=K[G];let De=$[G];if(De===void 0&&(G==="instanceMatrix"&&g.instanceMatrix&&(De=g.instanceMatrix),G==="instanceColor"&&g.instanceColor&&(De=g.instanceColor)),Me===void 0||Me.attribute!==De||De&&Me.data!==De.data)return!0;W++}return a.attributesNum!==W||a.index!==X}function D(g,P,B,X){const K={},$=P.attributes;let W=0;const ne=B.getAttributes();for(const G in ne)if(ne[G].location>=0){let Me=$[G];Me===void 0&&(G==="instanceMatrix"&&g.instanceMatrix&&(Me=g.instanceMatrix),G==="instanceColor"&&g.instanceColor&&(Me=g.instanceColor));const De={};De.attribute=Me,Me&&Me.data&&(De.data=Me.data),K[G]=De,W++}a.attributes=K,a.attributesNum=W,a.index=X}function C(){const g=a.newAttributes;for(let P=0,B=g.length;P<B;P++)g[P]=0}function d(g){c(g,0)}function c(g,P){const B=a.newAttributes,X=a.enabledAttributes,K=a.attributeDivisors;B[g]=1,X[g]===0&&(e.enableVertexAttribArray(g),X[g]=1),K[g]!==P&&(e.vertexAttribDivisor(g,P),K[g]=P)}function w(){const g=a.newAttributes,P=a.enabledAttributes;for(let B=0,X=P.length;B<X;B++)P[B]!==g[B]&&(e.disableVertexAttribArray(B),P[B]=0)}function A(g,P,B,X,K,$,W){W===!0?e.vertexAttribIPointer(g,P,B,K,$):e.vertexAttribPointer(g,P,B,X,K,$)}function M(g,P,B,X){C();const K=X.attributes,$=B.getAttributes(),W=P.defaultAttributeValues;for(const ne in $){const G=$[ne];if(G.location>=0){let ge=K[ne];if(ge===void 0&&(ne==="instanceMatrix"&&g.instanceMatrix&&(ge=g.instanceMatrix),ne==="instanceColor"&&g.instanceColor&&(ge=g.instanceColor)),ge!==void 0){const Me=ge.normalized,De=ge.itemSize,Ve=n.get(ge);if(Ve===void 0)continue;const nt=Ve.buffer,Je=Ve.type,We=Ve.bytesPerElement,k=Je===e.INT||Je===e.UNSIGNED_INT||ge.gpuType===zr;if(ge.isInterleavedBufferAttribute){const q=ge.data,le=q.stride,be=ge.offset;if(q.isInstancedInterleavedBuffer){for(let Ee=0;Ee<G.locationSize;Ee++)c(G.location+Ee,q.meshPerAttribute);g.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let Ee=0;Ee<G.locationSize;Ee++)d(G.location+Ee);e.bindBuffer(e.ARRAY_BUFFER,nt);for(let Ee=0;Ee<G.locationSize;Ee++)A(G.location+Ee,De/G.locationSize,Je,Me,le*We,(be+De/G.locationSize*Ee)*We,k)}else{if(ge.isInstancedBufferAttribute){for(let q=0;q<G.locationSize;q++)c(G.location+q,ge.meshPerAttribute);g.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ge.meshPerAttribute*ge.count)}else for(let q=0;q<G.locationSize;q++)d(G.location+q);e.bindBuffer(e.ARRAY_BUFFER,nt);for(let q=0;q<G.locationSize;q++)A(G.location+q,De/G.locationSize,Je,Me,De*We,De/G.locationSize*q*We,k)}}else if(W!==void 0){const Me=W[ne];if(Me!==void 0)switch(Me.length){case 2:e.vertexAttrib2fv(G.location,Me);break;case 3:e.vertexAttrib3fv(G.location,Me);break;case 4:e.vertexAttrib4fv(G.location,Me);break;default:e.vertexAttrib1fv(G.location,Me)}}}}w()}function N(){V();for(const g in i){const P=i[g];for(const B in P){const X=P[B];for(const K in X)m(X[K].object),delete X[K];delete P[B]}delete i[g]}}function L(g){if(i[g.id]===void 0)return;const P=i[g.id];for(const B in P){const X=P[B];for(const K in X)m(X[K].object),delete X[K];delete P[B]}delete i[g.id]}function I(g){for(const P in i){const B=i[P];if(B[g.id]===void 0)continue;const X=B[g.id];for(const K in X)m(X[K].object),delete X[K];delete B[g.id]}}function V(){E(),o=!0,a!==r&&(a=r,u(a.object))}function E(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:s,reset:V,resetDefaultState:E,dispose:N,releaseStatesOfGeometry:L,releaseStatesOfProgram:I,initAttributes:C,enableAttribute:d,disableUnusedAttributes:w}}function Wl(e,n,t){let i;function r(u){i=u}function a(u,m){e.drawArrays(i,u,m),t.update(m,i,1)}function o(u,m,h){h!==0&&(e.drawArraysInstanced(i,u,m,h),t.update(m,i,h))}function s(u,m,h){if(h===0)return;n.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,u,0,m,0,h);let S=0;for(let D=0;D<h;D++)S+=m[D];t.update(S,i,1)}function l(u,m,h,_){if(h===0)return;const S=n.get("WEBGL_multi_draw");if(S===null)for(let D=0;D<u.length;D++)o(u[D],m[D],_[D]);else{S.multiDrawArraysInstancedWEBGL(i,u,0,m,0,_,0,h);let D=0;for(let C=0;C<h;C++)D+=m[C]*_[C];t.update(D,i,1)}}this.setMode=r,this.render=a,this.renderInstances=o,this.renderMultiDraw=s,this.renderMultiDrawInstances=l}function Xl(e,n,t,i){let r;function a(){if(r!==void 0)return r;if(n.has("EXT_texture_filter_anisotropic")===!0){const I=n.get("EXT_texture_filter_anisotropic");r=e.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(I){return!(I!==bt&&i.convert(I)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function s(I){const V=I===bn&&(n.has("EXT_color_buffer_half_float")||n.has("EXT_color_buffer_float"));return!(I!==Xt&&i.convert(I)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE)&&I!==Vt&&!V)}function l(I){if(I==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let u=t.precision!==void 0?t.precision:"highp";const m=l(u);m!==u&&(console.warn("THREE.WebGLRenderer:",u,"not supported, using",m,"instead."),u=m);const h=t.logarithmicDepthBuffer===!0,_=t.reversedDepthBuffer===!0&&n.has("EXT_clip_control"),S=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),D=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),C=e.getParameter(e.MAX_TEXTURE_SIZE),d=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),c=e.getParameter(e.MAX_VERTEX_ATTRIBS),w=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),A=e.getParameter(e.MAX_VARYING_VECTORS),M=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),N=D>0,L=e.getParameter(e.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:s,precision:u,logarithmicDepthBuffer:h,reversedDepthBuffer:_,maxTextures:S,maxVertexTextures:D,maxTextureSize:C,maxCubemapSize:d,maxAttributes:c,maxVertexUniforms:w,maxVaryings:A,maxFragmentUniforms:M,vertexTextures:N,maxSamples:L}}function Kl(e){const n=this;let t=null,i=0,r=!1,a=!1;const o=new qa,s=new He,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,_){const S=h.length!==0||_||i!==0||r;return r=_,i=h.length,S},this.beginShadows=function(){a=!0,m(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(h,_){t=m(h,_,0)},this.setState=function(h,_,S){const D=h.clippingPlanes,C=h.clipIntersection,d=h.clipShadows,c=e.get(h);if(!r||D===null||D.length===0||a&&!d)a?m(null):u();else{const w=a?0:i,A=w*4;let M=c.clippingState||null;l.value=M,M=m(D,_,A,S);for(let N=0;N!==A;++N)M[N]=t[N];c.clippingState=M,this.numIntersection=C?this.numPlanes:0,this.numPlanes+=w}};function u(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),n.numPlanes=i,n.numIntersection=0}function m(h,_,S,D){const C=h!==null?h.length:0;let d=null;if(C!==0){if(d=l.value,D!==!0||d===null){const c=S+C*4,w=_.matrixWorldInverse;s.getNormalMatrix(w),(d===null||d.length<c)&&(d=new Float32Array(c));for(let A=0,M=S;A!==C;++A,M+=4)o.copy(h[A]).applyMatrix4(w,s),o.normal.toArray(d,M),d[M+3]=o.constant}l.value=d,l.needsUpdate=!0}return n.numPlanes=C,n.numIntersection=0,d}}function Yl(e){let n=new WeakMap;function t(o,s){return s===ni?o.mapping=hn:s===ii&&(o.mapping=nn),o}function i(o){if(o&&o.isTexture){const s=o.mapping;if(s===ni||s===ii)if(n.has(o)){const l=n.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const u=new lo(l.height);return u.fromEquirectangularTexture(e,o),n.set(o,u),o.addEventListener("dispose",r),t(u.texture,o.mapping)}else return null}}return o}function r(o){const s=o.target;s.removeEventListener("dispose",r);const l=n.get(s);l!==void 0&&(n.delete(s),l.dispose())}function a(){n=new WeakMap}return{get:i,dispose:a}}const jt=4,ir=[.125,.215,.35,.446,.526,.582],Ht=20,Hn=new Qr,rr=new Ge;let Gn=null,Vn=0,kn=0,zn=!1;const Bt=(1+Math.sqrt(5))/2,qt=1/Bt,ar=[new Fe(-Bt,qt,0),new Fe(Bt,qt,0),new Fe(-qt,0,Bt),new Fe(qt,0,Bt),new Fe(0,Bt,-qt),new Fe(0,Bt,qt),new Fe(-1,1,-1),new Fe(1,1,-1),new Fe(-1,1,1),new Fe(1,1,1)],ql=new Fe;class or{constructor(n){this._renderer=n,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(n,t=0,i=.1,r=100,a={}){const{size:o=256,position:s=ql}=a;Gn=this._renderer.getRenderTarget(),Vn=this._renderer.getActiveCubeFace(),kn=this._renderer.getActiveMipmapLevel(),zn=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(n,i,r,l,s),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(n,t=null){return this._fromTexture(n,t)}fromCubemap(n,t=null){return this._fromTexture(n,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=lr(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=cr(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(n){this._lodMax=Math.floor(Math.log2(n)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let n=0;n<this._lodPlanes.length;n++)this._lodPlanes[n].dispose()}_cleanup(n){this._renderer.setRenderTarget(Gn,Vn,kn),this._renderer.xr.enabled=zn,n.scissorTest=!1,vn(n,0,0,n.width,n.height)}_fromTexture(n,t){n.mapping===hn||n.mapping===nn?this._setSize(n.image.length===0?16:n.image[0].width||n.image[0].image.width):this._setSize(n.image.width/4),Gn=this._renderer.getRenderTarget(),Vn=this._renderer.getActiveCubeFace(),kn=this._renderer.getActiveMipmapLevel(),zn=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(n,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const n=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Lt,minFilter:Lt,generateMipmaps:!1,type:bn,format:bt,colorSpace:mt,depthBuffer:!1},r=sr(n,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==n||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=sr(n,t,i);const{_lodMax:a}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=$l(a)),this._blurMaterial=Zl(a,n,t)}return r}_compileMaterial(n){const t=new Pt(this._lodPlanes[0],n);this._renderer.compile(t,Hn)}_sceneToCubeUV(n,t,i,r,a){const l=new fn(90,1,t,i),u=[1,-1,1,1,1,1],m=[1,1,1,-1,-1,-1],h=this._renderer,_=h.autoClear,S=h.toneMapping;h.getClearColor(rr),h.toneMapping=Ut,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(r),h.clearDepth(),h.setRenderTarget(null));const C=new Zt({name:"PMREM.Background",side:Et,depthWrite:!1,depthTest:!1}),d=new Pt(new $r,C);let c=!1;const w=n.background;w?w.isColor&&(C.color.copy(w),n.background=null,c=!0):(C.color.copy(rr),c=!0);for(let A=0;A<6;A++){const M=A%3;M===0?(l.up.set(0,u[A],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x+m[A],a.y,a.z)):M===1?(l.up.set(0,0,u[A]),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y+m[A],a.z)):(l.up.set(0,u[A],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y,a.z+m[A]));const N=this._cubeSize;vn(r,M*N,A>2?N:0,N,N),h.setRenderTarget(r),c&&h.render(d,l),h.render(n,l)}d.geometry.dispose(),d.material.dispose(),h.toneMapping=S,h.autoClear=_,n.background=w}_textureToCubeUV(n,t){const i=this._renderer,r=n.mapping===hn||n.mapping===nn;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=lr()),this._cubemapMaterial.uniforms.flipEnvMap.value=n.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=cr());const a=r?this._cubemapMaterial:this._equirectMaterial,o=new Pt(this._lodPlanes[0],a),s=a.uniforms;s.envMap.value=n;const l=this._cubeSize;vn(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Hn)}_applyPMREM(n){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodPlanes.length;for(let a=1;a<r;a++){const o=Math.sqrt(this._sigmas[a]*this._sigmas[a]-this._sigmas[a-1]*this._sigmas[a-1]),s=ar[(r-a-1)%ar.length];this._blur(n,a-1,a,o,s)}t.autoClear=i}_blur(n,t,i,r,a){const o=this._pingPongRenderTarget;this._halfBlur(n,o,t,i,r,"latitudinal",a),this._halfBlur(o,n,i,i,r,"longitudinal",a)}_halfBlur(n,t,i,r,a,o,s){const l=this._renderer,u=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const m=3,h=new Pt(this._lodPlanes[r],u),_=u.uniforms,S=this._sizeLods[i]-1,D=isFinite(a)?Math.PI/(2*S):2*Math.PI/(2*Ht-1),C=a/D,d=isFinite(a)?1+Math.floor(m*C):Ht;d>Ht&&console.warn(`sigmaRadians, ${a}, is too large and will clip, as it requested ${d} samples when the maximum is set to ${Ht}`);const c=[];let w=0;for(let I=0;I<Ht;++I){const V=I/C,E=Math.exp(-V*V/2);c.push(E),I===0?w+=E:I<d&&(w+=2*E)}for(let I=0;I<c.length;I++)c[I]=c[I]/w;_.envMap.value=n.texture,_.samples.value=d,_.weights.value=c,_.latitudinal.value=o==="latitudinal",s&&(_.poleAxis.value=s);const{_lodMax:A}=this;_.dTheta.value=D,_.mipInt.value=A-i;const M=this._sizeLods[r],N=3*M*(r>A-jt?r-A+jt:0),L=4*(this._cubeSize-M);vn(t,N,L,3*M,2*M),l.setRenderTarget(t),l.render(h,Hn)}}function $l(e){const n=[],t=[],i=[];let r=e;const a=e-jt+1+ir.length;for(let o=0;o<a;o++){const s=Math.pow(2,r);t.push(s);let l=1/s;o>e-jt?l=ir[o-e+jt-1]:o===0&&(l=0),i.push(l);const u=1/(s-2),m=-u,h=1+u,_=[m,m,h,m,h,h,m,m,h,h,m,h],S=6,D=6,C=3,d=2,c=1,w=new Float32Array(C*D*S),A=new Float32Array(d*D*S),M=new Float32Array(c*D*S);for(let L=0;L<S;L++){const I=L%3*2/3-1,V=L>2?0:-1,E=[I,V,0,I+2/3,V,0,I+2/3,V+1,0,I,V,0,I+2/3,V+1,0,I,V+1,0];w.set(E,C*D*L),A.set(_,d*D*L);const g=[L,L,L,L,L,L];M.set(g,c*D*L)}const N=new fi;N.setAttribute("position",new zt(w,C)),N.setAttribute("uv",new zt(A,d)),N.setAttribute("faceIndex",new zt(M,c)),n.push(N),r>jt&&r--}return{lodPlanes:n,sizeLods:t,sigmas:i}}function sr(e,n,t){const i=new en(e,n,t);return i.texture.mapping=Ln,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function vn(e,n,t,i,r){e.viewport.set(n,t,i,r),e.scissor.set(n,t,i,r)}function Zl(e,n,t){const i=new Float32Array(Ht),r=new Fe(0,1,0);return new Kt({name:"SphericalGaussianBlur",defines:{n:Ht,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:ui(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Wt,depthTest:!1,depthWrite:!1})}function cr(){return new Kt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ui(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Wt,depthTest:!1,depthWrite:!1})}function lr(){return new Kt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ui(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Wt,depthTest:!1,depthWrite:!1})}function ui(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function jl(e){let n=new WeakMap,t=null;function i(s){if(s&&s.isTexture){const l=s.mapping,u=l===ni||l===ii,m=l===hn||l===nn;if(u||m){let h=n.get(s);const _=h!==void 0?h.texture.pmremVersion:0;if(s.isRenderTargetTexture&&s.pmremVersion!==_)return t===null&&(t=new or(e)),h=u?t.fromEquirectangular(s,h):t.fromCubemap(s,h),h.texture.pmremVersion=s.pmremVersion,n.set(s,h),h.texture;if(h!==void 0)return h.texture;{const S=s.image;return u&&S&&S.height>0||m&&S&&r(S)?(t===null&&(t=new or(e)),h=u?t.fromEquirectangular(s):t.fromCubemap(s),h.texture.pmremVersion=s.pmremVersion,n.set(s,h),s.addEventListener("dispose",a),h.texture):null}}}return s}function r(s){let l=0;const u=6;for(let m=0;m<u;m++)s[m]!==void 0&&l++;return l===u}function a(s){const l=s.target;l.removeEventListener("dispose",a);const u=n.get(l);u!==void 0&&(n.delete(l),u.dispose())}function o(){n=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function Ql(e){const n={};function t(i){if(n[i]!==void 0)return n[i];let r;switch(i){case"WEBGL_depth_texture":r=e.getExtension("WEBGL_depth_texture")||e.getExtension("MOZ_WEBGL_depth_texture")||e.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=e.getExtension("EXT_texture_filter_anisotropic")||e.getExtension("MOZ_EXT_texture_filter_anisotropic")||e.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=e.getExtension("WEBGL_compressed_texture_s3tc")||e.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||e.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=e.getExtension("WEBGL_compressed_texture_pvrtc")||e.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=e.getExtension(i)}return n[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&qn("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function Jl(e,n,t,i){const r={},a=new WeakMap;function o(h){const _=h.target;_.index!==null&&n.remove(_.index);for(const D in _.attributes)n.remove(_.attributes[D]);_.removeEventListener("dispose",o),delete r[_.id];const S=a.get(_);S&&(n.remove(S),a.delete(_)),i.releaseStatesOfGeometry(_),_.isInstancedBufferGeometry===!0&&delete _._maxInstanceCount,t.memory.geometries--}function s(h,_){return r[_.id]===!0||(_.addEventListener("dispose",o),r[_.id]=!0,t.memory.geometries++),_}function l(h){const _=h.attributes;for(const S in _)n.update(_[S],e.ARRAY_BUFFER)}function u(h){const _=[],S=h.index,D=h.attributes.position;let C=0;if(S!==null){const w=S.array;C=S.version;for(let A=0,M=w.length;A<M;A+=3){const N=w[A+0],L=w[A+1],I=w[A+2];_.push(N,L,L,I,I,N)}}else if(D!==void 0){const w=D.array;C=D.version;for(let A=0,M=w.length/3-1;A<M;A+=3){const N=A+0,L=A+1,I=A+2;_.push(N,L,L,I,I,N)}}else return;const d=new(_o(_)?ho:mo)(_,1);d.version=C;const c=a.get(h);c&&n.remove(c),a.set(h,d)}function m(h){const _=a.get(h);if(_){const S=h.index;S!==null&&_.version<S.version&&u(h)}else u(h);return a.get(h)}return{get:s,update:l,getWireframeAttribute:m}}function ef(e,n,t){let i;function r(_){i=_}let a,o;function s(_){a=_.type,o=_.bytesPerElement}function l(_,S){e.drawElements(i,S,a,_*o),t.update(S,i,1)}function u(_,S,D){D!==0&&(e.drawElementsInstanced(i,S,a,_*o,D),t.update(S,i,D))}function m(_,S,D){if(D===0)return;n.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,S,0,a,_,0,D);let d=0;for(let c=0;c<D;c++)d+=S[c];t.update(d,i,1)}function h(_,S,D,C){if(D===0)return;const d=n.get("WEBGL_multi_draw");if(d===null)for(let c=0;c<_.length;c++)u(_[c]/o,S[c],C[c]);else{d.multiDrawElementsInstancedWEBGL(i,S,0,a,_,0,C,0,D);let c=0;for(let w=0;w<D;w++)c+=S[w]*C[w];t.update(c,i,1)}}this.setMode=r,this.setIndex=s,this.render=l,this.renderInstances=u,this.renderMultiDraw=m,this.renderMultiDrawInstances=h}function tf(e){const n={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,o,s){switch(t.calls++,o){case e.TRIANGLES:t.triangles+=s*(a/3);break;case e.LINES:t.lines+=s*(a/2);break;case e.LINE_STRIP:t.lines+=s*(a-1);break;case e.LINE_LOOP:t.lines+=s*a;break;case e.POINTS:t.points+=s*a;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:n,render:t,programs:null,autoReset:!0,reset:r,update:i}}function nf(e,n,t){const i=new WeakMap,r=new dt;function a(o,s,l){const u=o.morphTargetInfluences,m=s.morphAttributes.position||s.morphAttributes.normal||s.morphAttributes.color,h=m!==void 0?m.length:0;let _=i.get(s);if(_===void 0||_.count!==h){let E=function(){I.dispose(),i.delete(s),s.removeEventListener("dispose",E)};_!==void 0&&_.texture.dispose();const S=s.morphAttributes.position!==void 0,D=s.morphAttributes.normal!==void 0,C=s.morphAttributes.color!==void 0,d=s.morphAttributes.position||[],c=s.morphAttributes.normal||[],w=s.morphAttributes.color||[];let A=0;S===!0&&(A=1),D===!0&&(A=2),C===!0&&(A=3);let M=s.attributes.position.count*A,N=1;M>n.maxTextureSize&&(N=Math.ceil(M/n.maxTextureSize),M=n.maxTextureSize);const L=new Float32Array(M*N*4*h),I=new Yr(L,M,N,h);I.type=Vt,I.needsUpdate=!0;const V=A*4;for(let g=0;g<h;g++){const P=d[g],B=c[g],X=w[g],K=M*N*4*g;for(let $=0;$<P.count;$++){const W=$*V;S===!0&&(r.fromBufferAttribute(P,$),L[K+W+0]=r.x,L[K+W+1]=r.y,L[K+W+2]=r.z,L[K+W+3]=0),D===!0&&(r.fromBufferAttribute(B,$),L[K+W+4]=r.x,L[K+W+5]=r.y,L[K+W+6]=r.z,L[K+W+7]=0),C===!0&&(r.fromBufferAttribute(X,$),L[K+W+8]=r.x,L[K+W+9]=r.y,L[K+W+10]=r.z,L[K+W+11]=X.itemSize===4?r.w:1)}}_={count:h,texture:I,size:new ct(M,N)},i.set(s,_),s.addEventListener("dispose",E)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(e,"morphTexture",o.morphTexture,t);else{let S=0;for(let C=0;C<u.length;C++)S+=u[C];const D=s.morphTargetsRelative?1:1-S;l.getUniforms().setValue(e,"morphTargetBaseInfluence",D),l.getUniforms().setValue(e,"morphTargetInfluences",u)}l.getUniforms().setValue(e,"morphTargetsTexture",_.texture,t),l.getUniforms().setValue(e,"morphTargetsTextureSize",_.size)}return{update:a}}function rf(e,n,t,i){let r=new WeakMap;function a(l){const u=i.render.frame,m=l.geometry,h=n.get(l,m);if(r.get(h)!==u&&(n.update(h),r.set(h,u)),l.isInstancedMesh&&(l.hasEventListener("dispose",s)===!1&&l.addEventListener("dispose",s),r.get(l)!==u&&(t.update(l.instanceMatrix,e.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,e.ARRAY_BUFFER),r.set(l,u))),l.isSkinnedMesh){const _=l.skeleton;r.get(_)!==u&&(_.update(),r.set(_,u))}return h}function o(){r=new WeakMap}function s(l){const u=l.target;u.removeEventListener("dispose",s),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}const oa=new ri,fr=new Ir(1,1),sa=new Yr,ca=new bo,la=new Co,ur=[],dr=[],pr=new Float32Array(16),hr=new Float32Array(9),mr=new Float32Array(4);function rn(e,n,t){const i=e[0];if(i<=0||i>0)return e;const r=n*t;let a=ur[r];if(a===void 0&&(a=new Float32Array(r),ur[r]=a),n!==0){i.toArray(a,0);for(let o=1,s=0;o!==n;++o)s+=t,e[o].toArray(a,s)}return a}function rt(e,n){if(e.length!==n.length)return!1;for(let t=0,i=e.length;t<i;t++)if(e[t]!==n[t])return!1;return!0}function at(e,n){for(let t=0,i=n.length;t<i;t++)e[t]=n[t]}function Pn(e,n){let t=dr[n];t===void 0&&(t=new Int32Array(n),dr[n]=t);for(let i=0;i!==n;++i)t[i]=e.allocateTextureUnit();return t}function af(e,n){const t=this.cache;t[0]!==n&&(e.uniform1f(this.addr,n),t[0]=n)}function of(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2f(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(rt(t,n))return;e.uniform2fv(this.addr,n),at(t,n)}}function sf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3f(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else if(n.r!==void 0)(t[0]!==n.r||t[1]!==n.g||t[2]!==n.b)&&(e.uniform3f(this.addr,n.r,n.g,n.b),t[0]=n.r,t[1]=n.g,t[2]=n.b);else{if(rt(t,n))return;e.uniform3fv(this.addr,n),at(t,n)}}function cf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4f(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(rt(t,n))return;e.uniform4fv(this.addr,n),at(t,n)}}function lf(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(rt(t,n))return;e.uniformMatrix2fv(this.addr,!1,n),at(t,n)}else{if(rt(t,i))return;mr.set(i),e.uniformMatrix2fv(this.addr,!1,mr),at(t,i)}}function ff(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(rt(t,n))return;e.uniformMatrix3fv(this.addr,!1,n),at(t,n)}else{if(rt(t,i))return;hr.set(i),e.uniformMatrix3fv(this.addr,!1,hr),at(t,i)}}function uf(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(rt(t,n))return;e.uniformMatrix4fv(this.addr,!1,n),at(t,n)}else{if(rt(t,i))return;pr.set(i),e.uniformMatrix4fv(this.addr,!1,pr),at(t,i)}}function df(e,n){const t=this.cache;t[0]!==n&&(e.uniform1i(this.addr,n),t[0]=n)}function pf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2i(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(rt(t,n))return;e.uniform2iv(this.addr,n),at(t,n)}}function hf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3i(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(rt(t,n))return;e.uniform3iv(this.addr,n),at(t,n)}}function mf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4i(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(rt(t,n))return;e.uniform4iv(this.addr,n),at(t,n)}}function _f(e,n){const t=this.cache;t[0]!==n&&(e.uniform1ui(this.addr,n),t[0]=n)}function gf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2ui(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(rt(t,n))return;e.uniform2uiv(this.addr,n),at(t,n)}}function vf(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3ui(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(rt(t,n))return;e.uniform3uiv(this.addr,n),at(t,n)}}function Ef(e,n){const t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4ui(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(rt(t,n))return;e.uniform4uiv(this.addr,n),at(t,n)}}function Sf(e,n,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(e.uniform1i(this.addr,r),i[0]=r);let a;this.type===e.SAMPLER_2D_SHADOW?(fr.compareFunction=Fr,a=fr):a=oa,t.setTexture2D(n||a,r)}function Tf(e,n,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(e.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(n||ca,r)}function Mf(e,n,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(e.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(n||la,r)}function xf(e,n,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(e.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(n||sa,r)}function Af(e){switch(e){case 5126:return af;case 35664:return of;case 35665:return sf;case 35666:return cf;case 35674:return lf;case 35675:return ff;case 35676:return uf;case 5124:case 35670:return df;case 35667:case 35671:return pf;case 35668:case 35672:return hf;case 35669:case 35673:return mf;case 5125:return _f;case 36294:return gf;case 36295:return vf;case 36296:return Ef;case 35678:case 36198:case 36298:case 36306:case 35682:return Sf;case 35679:case 36299:case 36307:return Tf;case 35680:case 36300:case 36308:case 36293:return Mf;case 36289:case 36303:case 36311:case 36292:return xf}}function Rf(e,n){e.uniform1fv(this.addr,n)}function Cf(e,n){const t=rn(n,this.size,2);e.uniform2fv(this.addr,t)}function bf(e,n){const t=rn(n,this.size,3);e.uniform3fv(this.addr,t)}function Lf(e,n){const t=rn(n,this.size,4);e.uniform4fv(this.addr,t)}function Pf(e,n){const t=rn(n,this.size,4);e.uniformMatrix2fv(this.addr,!1,t)}function wf(e,n){const t=rn(n,this.size,9);e.uniformMatrix3fv(this.addr,!1,t)}function Df(e,n){const t=rn(n,this.size,16);e.uniformMatrix4fv(this.addr,!1,t)}function Uf(e,n){e.uniform1iv(this.addr,n)}function If(e,n){e.uniform2iv(this.addr,n)}function Nf(e,n){e.uniform3iv(this.addr,n)}function yf(e,n){e.uniform4iv(this.addr,n)}function Of(e,n){e.uniform1uiv(this.addr,n)}function Ff(e,n){e.uniform2uiv(this.addr,n)}function Bf(e,n){e.uniform3uiv(this.addr,n)}function Hf(e,n){e.uniform4uiv(this.addr,n)}function Gf(e,n,t){const i=this.cache,r=n.length,a=Pn(t,r);rt(i,a)||(e.uniform1iv(this.addr,a),at(i,a));for(let o=0;o!==r;++o)t.setTexture2D(n[o]||oa,a[o])}function Vf(e,n,t){const i=this.cache,r=n.length,a=Pn(t,r);rt(i,a)||(e.uniform1iv(this.addr,a),at(i,a));for(let o=0;o!==r;++o)t.setTexture3D(n[o]||ca,a[o])}function kf(e,n,t){const i=this.cache,r=n.length,a=Pn(t,r);rt(i,a)||(e.uniform1iv(this.addr,a),at(i,a));for(let o=0;o!==r;++o)t.setTextureCube(n[o]||la,a[o])}function zf(e,n,t){const i=this.cache,r=n.length,a=Pn(t,r);rt(i,a)||(e.uniform1iv(this.addr,a),at(i,a));for(let o=0;o!==r;++o)t.setTexture2DArray(n[o]||sa,a[o])}function Wf(e){switch(e){case 5126:return Rf;case 35664:return Cf;case 35665:return bf;case 35666:return Lf;case 35674:return Pf;case 35675:return wf;case 35676:return Df;case 5124:case 35670:return Uf;case 35667:case 35671:return If;case 35668:case 35672:return Nf;case 35669:case 35673:return yf;case 5125:return Of;case 36294:return Ff;case 36295:return Bf;case 36296:return Hf;case 35678:case 36198:case 36298:case 36306:case 35682:return Gf;case 35679:case 36299:case 36307:return Vf;case 35680:case 36300:case 36308:case 36293:return kf;case 36289:case 36303:case 36311:case 36292:return zf}}class Xf{constructor(n,t,i){this.id=n,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Af(t.type)}}class Kf{constructor(n,t,i){this.id=n,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Wf(t.type)}}class Yf{constructor(n){this.id=n,this.seq=[],this.map={}}setValue(n,t,i){const r=this.seq;for(let a=0,o=r.length;a!==o;++a){const s=r[a];s.setValue(n,t[s.id],i)}}}const Wn=/(\w+)(\])?(\[|\.)?/g;function _r(e,n){e.seq.push(n),e.map[n.id]=n}function qf(e,n,t){const i=e.name,r=i.length;for(Wn.lastIndex=0;;){const a=Wn.exec(i),o=Wn.lastIndex;let s=a[1];const l=a[2]==="]",u=a[3];if(l&&(s=s|0),u===void 0||u==="["&&o+2===r){_r(t,u===void 0?new Xf(s,e,n):new Kf(s,e,n));break}else{let h=t.map[s];h===void 0&&(h=new Yf(s),_r(t,h)),t=h}}}class Mn{constructor(n,t){this.seq=[],this.map={};const i=n.getProgramParameter(t,n.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const a=n.getActiveUniform(t,r),o=n.getUniformLocation(t,a.name);qf(a,o,this)}}setValue(n,t,i,r){const a=this.map[t];a!==void 0&&a.setValue(n,i,r)}setOptional(n,t,i){const r=t[i];r!==void 0&&this.setValue(n,i,r)}static upload(n,t,i,r){for(let a=0,o=t.length;a!==o;++a){const s=t[a],l=i[s.id];l.needsUpdate!==!1&&s.setValue(n,l.value,r)}}static seqWithValue(n,t){const i=[];for(let r=0,a=n.length;r!==a;++r){const o=n[r];o.id in t&&i.push(o)}return i}}function gr(e,n,t){const i=e.createShader(n);return e.shaderSource(i,t),e.compileShader(i),i}const $f=37297;let Zf=0;function jf(e,n){const t=e.split(`
`),i=[],r=Math.max(n-6,0),a=Math.min(n+6,t.length);for(let o=r;o<a;o++){const s=o+1;i.push(`${s===n?">":" "} ${s}: ${t[o]}`)}return i.join(`
`)}const vr=new He;function Qf(e){tt._getMatrix(vr,tt.workingColorSpace,e);const n=`mat3( ${vr.elements.map(t=>t.toFixed(4))} )`;switch(tt.getTransfer(e)){case jr:return[n,"LinearTransferOETF"];case qe:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",e),[n,"LinearTransferOETF"]}}function Er(e,n,t){const i=e.getShaderParameter(n,e.COMPILE_STATUS),a=(e.getShaderInfoLog(n)||"").trim();if(i&&a==="")return"";const o=/ERROR: 0:(\d+)/.exec(a);if(o){const s=parseInt(o[1]);return t.toUpperCase()+`

`+a+`

`+jf(e.getShaderSource(n),s)}else return a}function Jf(e,n){const t=Qf(n);return[`vec4 ${e}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function eu(e,n){let t;switch(n){case Ro:t="Linear";break;case Ao:t="Reinhard";break;case xo:t="Cineon";break;case Mo:t="ACESFilmic";break;case To:t="AgX";break;case So:t="Neutral";break;case Eo:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",n),t="Linear"}return"vec3 "+e+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const En=new Fe;function tu(){tt.getLuminanceCoefficients(En);const e=En.x.toFixed(4),n=En.y.toFixed(4),t=En.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${n}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function nu(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ln).join(`
`)}function iu(e){const n=[];for(const t in e){const i=e[t];i!==!1&&n.push("#define "+t+" "+i)}return n.join(`
`)}function ru(e,n){const t={},i=e.getProgramParameter(n,e.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const a=e.getActiveAttrib(n,r),o=a.name;let s=1;a.type===e.FLOAT_MAT2&&(s=2),a.type===e.FLOAT_MAT3&&(s=3),a.type===e.FLOAT_MAT4&&(s=4),t[o]={type:a.type,location:e.getAttribLocation(n,o),locationSize:s}}return t}function ln(e){return e!==""}function Sr(e,n){const t=n.numSpotLightShadows+n.numSpotLightMaps-n.numSpotLightShadowsWithMaps;return e.replace(/NUM_DIR_LIGHTS/g,n.numDirLights).replace(/NUM_SPOT_LIGHTS/g,n.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,n.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,n.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,n.numPointLights).replace(/NUM_HEMI_LIGHTS/g,n.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,n.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,n.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,n.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,n.numPointLightShadows)}function Tr(e,n){return e.replace(/NUM_CLIPPING_PLANES/g,n.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,n.numClippingPlanes-n.numClipIntersection)}const au=/^[ \t]*#include +<([\w\d./]+)>/gm;function oi(e){return e.replace(au,su)}const ou=new Map;function su(e,n){let t=Ie[n];if(t===void 0){const i=ou.get(n);if(i!==void 0)t=Ie[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',n,i);else throw new Error("Can not resolve #include <"+n+">")}return oi(t)}const cu=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Mr(e){return e.replace(cu,lu)}function lu(e,n,t,i){let r="";for(let a=parseInt(n);a<parseInt(t);a++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function xr(e){let n=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision==="highp"?n+=`
#define HIGH_PRECISION`:e.precision==="mediump"?n+=`
#define MEDIUM_PRECISION`:e.precision==="lowp"&&(n+=`
#define LOW_PRECISION`),n}function fu(e){let n="SHADOWMAP_TYPE_BASIC";return e.shadowMapType===Br?n="SHADOWMAP_TYPE_PCF":e.shadowMapType===vo?n="SHADOWMAP_TYPE_PCF_SOFT":e.shadowMapType===Ct&&(n="SHADOWMAP_TYPE_VSM"),n}function uu(e){let n="ENVMAP_TYPE_CUBE";if(e.envMap)switch(e.envMapMode){case hn:case nn:n="ENVMAP_TYPE_CUBE";break;case Ln:n="ENVMAP_TYPE_CUBE_UV";break}return n}function du(e){let n="ENVMAP_MODE_REFLECTION";if(e.envMap)switch(e.envMapMode){case nn:n="ENVMAP_MODE_REFRACTION";break}return n}function pu(e){let n="ENVMAP_BLENDING_NONE";if(e.envMap)switch(e.combine){case Do:n="ENVMAP_BLENDING_MULTIPLY";break;case wo:n="ENVMAP_BLENDING_MIX";break;case Po:n="ENVMAP_BLENDING_ADD";break}return n}function hu(e){const n=e.envMapCubeUVHeight;if(n===null)return null;const t=Math.log2(n)-2,i=1/n;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function mu(e,n,t,i){const r=e.getContext(),a=t.defines;let o=t.vertexShader,s=t.fragmentShader;const l=fu(t),u=uu(t),m=du(t),h=pu(t),_=hu(t),S=nu(t),D=iu(a),C=r.createProgram();let d,c,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,D].filter(ln).join(`
`),d.length>0&&(d+=`
`),c=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,D].filter(ln).join(`
`),c.length>0&&(c+=`
`)):(d=[xr(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,D,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+m:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ln).join(`
`),c=[xr(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,D,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.envMap?"#define "+m:"",t.envMap?"#define "+h:"",_?"#define CUBEUV_TEXEL_WIDTH "+_.texelWidth:"",_?"#define CUBEUV_TEXEL_HEIGHT "+_.texelHeight:"",_?"#define CUBEUV_MAX_MIP "+_.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ut?"#define TONE_MAPPING":"",t.toneMapping!==Ut?Ie.tonemapping_pars_fragment:"",t.toneMapping!==Ut?eu("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ie.colorspace_pars_fragment,Jf("linearToOutputTexel",t.outputColorSpace),tu(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ln).join(`
`)),o=oi(o),o=Sr(o,t),o=Tr(o,t),s=oi(s),s=Sr(s,t),s=Tr(s,t),o=Mr(o),s=Mr(s),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,d=[S,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+d,c=["#define varying in",t.glslVersion===Ji?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ji?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+c);const A=w+d+o,M=w+c+s,N=gr(r,r.VERTEX_SHADER,A),L=gr(r,r.FRAGMENT_SHADER,M);r.attachShader(C,N),r.attachShader(C,L),t.index0AttributeName!==void 0?r.bindAttribLocation(C,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(C,0,"position"),r.linkProgram(C);function I(P){if(e.debug.checkShaderErrors){const B=r.getProgramInfoLog(C)||"",X=r.getShaderInfoLog(N)||"",K=r.getShaderInfoLog(L)||"",$=B.trim(),W=X.trim(),ne=K.trim();let G=!0,ge=!0;if(r.getProgramParameter(C,r.LINK_STATUS)===!1)if(G=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(r,C,N,L);else{const Me=Er(r,N,"vertex"),De=Er(r,L,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(C,r.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+$+`
`+Me+`
`+De)}else $!==""?console.warn("THREE.WebGLProgram: Program Info Log:",$):(W===""||ne==="")&&(ge=!1);ge&&(P.diagnostics={runnable:G,programLog:$,vertexShader:{log:W,prefix:d},fragmentShader:{log:ne,prefix:c}})}r.deleteShader(N),r.deleteShader(L),V=new Mn(r,C),E=ru(r,C)}let V;this.getUniforms=function(){return V===void 0&&I(this),V};let E;this.getAttributes=function(){return E===void 0&&I(this),E};let g=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return g===!1&&(g=r.getProgramParameter(C,$f)),g},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(C),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Zf++,this.cacheKey=n,this.usedTimes=1,this.program=C,this.vertexShader=N,this.fragmentShader=L,this}let _u=0;class gu{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(n){const t=n.vertexShader,i=n.fragmentShader,r=this._getShaderStage(t),a=this._getShaderStage(i),o=this._getShaderCacheForMaterial(n);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(a)===!1&&(o.add(a),a.usedTimes++),this}remove(n){const t=this.materialCache.get(n);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(n),this}getVertexShaderID(n){return this._getShaderStage(n.vertexShader).id}getFragmentShaderID(n){return this._getShaderStage(n.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(n){const t=this.materialCache;let i=t.get(n);return i===void 0&&(i=new Set,t.set(n,i)),i}_getShaderStage(n){const t=this.shaderCache;let i=t.get(n);return i===void 0&&(i=new vu(n),t.set(n,i)),i}}class vu{constructor(n){this.id=_u++,this.code=n,this.usedTimes=0}}function Eu(e,n,t,i,r,a,o){const s=new go,l=new gu,u=new Set,m=[],h=r.logarithmicDepthBuffer,_=r.vertexTextures;let S=r.precision;const D={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function C(E){return u.add(E),E===0?"uv":`uv${E}`}function d(E,g,P,B,X){const K=B.fog,$=X.geometry,W=E.isMeshStandardMaterial?B.environment:null,ne=(E.isMeshStandardMaterial?t:n).get(E.envMap||W),G=ne&&ne.mapping===Ln?ne.image.height:null,ge=D[E.type];E.precision!==null&&(S=r.getMaxPrecision(E.precision),S!==E.precision&&console.warn("THREE.WebGLProgram.getParameters:",E.precision,"not supported, using",S,"instead."));const Me=$.morphAttributes.position||$.morphAttributes.normal||$.morphAttributes.color,De=Me!==void 0?Me.length:0;let Ve=0;$.morphAttributes.position!==void 0&&(Ve=1),$.morphAttributes.normal!==void 0&&(Ve=2),$.morphAttributes.color!==void 0&&(Ve=3);let nt,Je,We,k;if(ge){const ke=Mt[ge];nt=ke.vertexShader,Je=ke.fragmentShader}else nt=E.vertexShader,Je=E.fragmentShader,l.update(E),We=l.getVertexShaderID(E),k=l.getFragmentShaderID(E);const q=e.getRenderTarget(),le=e.state.buffers.depth.getReversed(),be=X.isInstancedMesh===!0,Ee=X.isBatchedMesh===!0,Oe=!!E.map,st=!!E.matcap,T=!!ne,$e=!!E.aoMap,Pe=!!E.lightMap,Re=!!E.bumpMap,de=!!E.normalMap,Ze=!!E.displacementMap,pe=!!E.emissiveMap,Ue=!!E.metalnessMap,ot=!!E.roughnessMap,it=E.anisotropy>0,v=E.clearcoat>0,f=E.dispersion>0,U=E.iridescence>0,H=E.sheen>0,Y=E.transmission>0,F=it&&!!E.anisotropyMap,ve=v&&!!E.clearcoatMap,ee=v&&!!E.clearcoatNormalMap,he=v&&!!E.clearcoatRoughnessMap,me=U&&!!E.iridescenceMap,Q=U&&!!E.iridescenceThicknessMap,oe=H&&!!E.sheenColorMap,Ae=H&&!!E.sheenRoughnessMap,_e=!!E.specularMap,re=!!E.specularColorMap,we=!!E.specularIntensityMap,x=Y&&!!E.transmissionMap,J=Y&&!!E.thicknessMap,te=!!E.gradientMap,ce=!!E.alphaMap,Z=E.alphaTest>0,z=!!E.alphaHash,ue=!!E.extensions;let Le=Ut;E.toneMapped&&(q===null||q.isXRRenderTarget===!0)&&(Le=e.toneMapping);const Ke={shaderID:ge,shaderType:E.type,shaderName:E.name,vertexShader:nt,fragmentShader:Je,defines:E.defines,customVertexShaderID:We,customFragmentShaderID:k,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:S,batching:Ee,batchingColor:Ee&&X._colorsTexture!==null,instancing:be,instancingColor:be&&X.instanceColor!==null,instancingMorph:be&&X.morphTexture!==null,supportsVertexTextures:_,outputColorSpace:q===null?e.outputColorSpace:q.isXRRenderTarget===!0?q.texture.colorSpace:mt,alphaToCoverage:!!E.alphaToCoverage,map:Oe,matcap:st,envMap:T,envMapMode:T&&ne.mapping,envMapCubeUVHeight:G,aoMap:$e,lightMap:Pe,bumpMap:Re,normalMap:de,displacementMap:_&&Ze,emissiveMap:pe,normalMapObjectSpace:de&&E.normalMapType===po,normalMapTangentSpace:de&&E.normalMapType===uo,metalnessMap:Ue,roughnessMap:ot,anisotropy:it,anisotropyMap:F,clearcoat:v,clearcoatMap:ve,clearcoatNormalMap:ee,clearcoatRoughnessMap:he,dispersion:f,iridescence:U,iridescenceMap:me,iridescenceThicknessMap:Q,sheen:H,sheenColorMap:oe,sheenRoughnessMap:Ae,specularMap:_e,specularColorMap:re,specularIntensityMap:we,transmission:Y,transmissionMap:x,thicknessMap:J,gradientMap:te,opaque:E.transparent===!1&&E.blending===Tn&&E.alphaToCoverage===!1,alphaMap:ce,alphaTest:Z,alphaHash:z,combine:E.combine,mapUv:Oe&&C(E.map.channel),aoMapUv:$e&&C(E.aoMap.channel),lightMapUv:Pe&&C(E.lightMap.channel),bumpMapUv:Re&&C(E.bumpMap.channel),normalMapUv:de&&C(E.normalMap.channel),displacementMapUv:Ze&&C(E.displacementMap.channel),emissiveMapUv:pe&&C(E.emissiveMap.channel),metalnessMapUv:Ue&&C(E.metalnessMap.channel),roughnessMapUv:ot&&C(E.roughnessMap.channel),anisotropyMapUv:F&&C(E.anisotropyMap.channel),clearcoatMapUv:ve&&C(E.clearcoatMap.channel),clearcoatNormalMapUv:ee&&C(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:he&&C(E.clearcoatRoughnessMap.channel),iridescenceMapUv:me&&C(E.iridescenceMap.channel),iridescenceThicknessMapUv:Q&&C(E.iridescenceThicknessMap.channel),sheenColorMapUv:oe&&C(E.sheenColorMap.channel),sheenRoughnessMapUv:Ae&&C(E.sheenRoughnessMap.channel),specularMapUv:_e&&C(E.specularMap.channel),specularColorMapUv:re&&C(E.specularColorMap.channel),specularIntensityMapUv:we&&C(E.specularIntensityMap.channel),transmissionMapUv:x&&C(E.transmissionMap.channel),thicknessMapUv:J&&C(E.thicknessMap.channel),alphaMapUv:ce&&C(E.alphaMap.channel),vertexTangents:!!$.attributes.tangent&&(de||it),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!$.attributes.color&&$.attributes.color.itemSize===4,pointsUvs:X.isPoints===!0&&!!$.attributes.uv&&(Oe||ce),fog:!!K,useFog:E.fog===!0,fogExp2:!!K&&K.isFogExp2,flatShading:E.flatShading===!0&&E.wireframe===!1,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:le,skinning:X.isSkinnedMesh===!0,morphTargets:$.morphAttributes.position!==void 0,morphNormals:$.morphAttributes.normal!==void 0,morphColors:$.morphAttributes.color!==void 0,morphTargetsCount:De,morphTextureStride:Ve,numDirLights:g.directional.length,numPointLights:g.point.length,numSpotLights:g.spot.length,numSpotLightMaps:g.spotLightMap.length,numRectAreaLights:g.rectArea.length,numHemiLights:g.hemi.length,numDirLightShadows:g.directionalShadowMap.length,numPointLightShadows:g.pointShadowMap.length,numSpotLightShadows:g.spotShadowMap.length,numSpotLightShadowsWithMaps:g.numSpotLightShadowsWithMaps,numLightProbes:g.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:E.dithering,shadowMapEnabled:e.shadowMap.enabled&&P.length>0,shadowMapType:e.shadowMap.type,toneMapping:Le,decodeVideoTexture:Oe&&E.map.isVideoTexture===!0&&tt.getTransfer(E.map.colorSpace)===qe,decodeVideoTextureEmissive:pe&&E.emissiveMap.isVideoTexture===!0&&tt.getTransfer(E.emissiveMap.colorSpace)===qe,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===xt,flipSided:E.side===Et,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:ue&&E.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ue&&E.extensions.multiDraw===!0||Ee)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return Ke.vertexUv1s=u.has(1),Ke.vertexUv2s=u.has(2),Ke.vertexUv3s=u.has(3),u.clear(),Ke}function c(E){const g=[];if(E.shaderID?g.push(E.shaderID):(g.push(E.customVertexShaderID),g.push(E.customFragmentShaderID)),E.defines!==void 0)for(const P in E.defines)g.push(P),g.push(E.defines[P]);return E.isRawShaderMaterial===!1&&(w(g,E),A(g,E),g.push(e.outputColorSpace)),g.push(E.customProgramCacheKey),g.join()}function w(E,g){E.push(g.precision),E.push(g.outputColorSpace),E.push(g.envMapMode),E.push(g.envMapCubeUVHeight),E.push(g.mapUv),E.push(g.alphaMapUv),E.push(g.lightMapUv),E.push(g.aoMapUv),E.push(g.bumpMapUv),E.push(g.normalMapUv),E.push(g.displacementMapUv),E.push(g.emissiveMapUv),E.push(g.metalnessMapUv),E.push(g.roughnessMapUv),E.push(g.anisotropyMapUv),E.push(g.clearcoatMapUv),E.push(g.clearcoatNormalMapUv),E.push(g.clearcoatRoughnessMapUv),E.push(g.iridescenceMapUv),E.push(g.iridescenceThicknessMapUv),E.push(g.sheenColorMapUv),E.push(g.sheenRoughnessMapUv),E.push(g.specularMapUv),E.push(g.specularColorMapUv),E.push(g.specularIntensityMapUv),E.push(g.transmissionMapUv),E.push(g.thicknessMapUv),E.push(g.combine),E.push(g.fogExp2),E.push(g.sizeAttenuation),E.push(g.morphTargetsCount),E.push(g.morphAttributeCount),E.push(g.numDirLights),E.push(g.numPointLights),E.push(g.numSpotLights),E.push(g.numSpotLightMaps),E.push(g.numHemiLights),E.push(g.numRectAreaLights),E.push(g.numDirLightShadows),E.push(g.numPointLightShadows),E.push(g.numSpotLightShadows),E.push(g.numSpotLightShadowsWithMaps),E.push(g.numLightProbes),E.push(g.shadowMapType),E.push(g.toneMapping),E.push(g.numClippingPlanes),E.push(g.numClipIntersection),E.push(g.depthPacking)}function A(E,g){s.disableAll(),g.supportsVertexTextures&&s.enable(0),g.instancing&&s.enable(1),g.instancingColor&&s.enable(2),g.instancingMorph&&s.enable(3),g.matcap&&s.enable(4),g.envMap&&s.enable(5),g.normalMapObjectSpace&&s.enable(6),g.normalMapTangentSpace&&s.enable(7),g.clearcoat&&s.enable(8),g.iridescence&&s.enable(9),g.alphaTest&&s.enable(10),g.vertexColors&&s.enable(11),g.vertexAlphas&&s.enable(12),g.vertexUv1s&&s.enable(13),g.vertexUv2s&&s.enable(14),g.vertexUv3s&&s.enable(15),g.vertexTangents&&s.enable(16),g.anisotropy&&s.enable(17),g.alphaHash&&s.enable(18),g.batching&&s.enable(19),g.dispersion&&s.enable(20),g.batchingColor&&s.enable(21),g.gradientMap&&s.enable(22),E.push(s.mask),s.disableAll(),g.fog&&s.enable(0),g.useFog&&s.enable(1),g.flatShading&&s.enable(2),g.logarithmicDepthBuffer&&s.enable(3),g.reversedDepthBuffer&&s.enable(4),g.skinning&&s.enable(5),g.morphTargets&&s.enable(6),g.morphNormals&&s.enable(7),g.morphColors&&s.enable(8),g.premultipliedAlpha&&s.enable(9),g.shadowMapEnabled&&s.enable(10),g.doubleSided&&s.enable(11),g.flipSided&&s.enable(12),g.useDepthPacking&&s.enable(13),g.dithering&&s.enable(14),g.transmission&&s.enable(15),g.sheen&&s.enable(16),g.opaque&&s.enable(17),g.pointsUvs&&s.enable(18),g.decodeVideoTexture&&s.enable(19),g.decodeVideoTextureEmissive&&s.enable(20),g.alphaToCoverage&&s.enable(21),E.push(s.mask)}function M(E){const g=D[E.type];let P;if(g){const B=Mt[g];P=fo.clone(B.uniforms)}else P=E.uniforms;return P}function N(E,g){let P;for(let B=0,X=m.length;B<X;B++){const K=m[B];if(K.cacheKey===g){P=K,++P.usedTimes;break}}return P===void 0&&(P=new mu(e,g,E,a),m.push(P)),P}function L(E){if(--E.usedTimes===0){const g=m.indexOf(E);m[g]=m[m.length-1],m.pop(),E.destroy()}}function I(E){l.remove(E)}function V(){l.dispose()}return{getParameters:d,getProgramCacheKey:c,getUniforms:M,acquireProgram:N,releaseProgram:L,releaseShaderCache:I,programs:m,dispose:V}}function Su(){let e=new WeakMap;function n(o){return e.has(o)}function t(o){let s=e.get(o);return s===void 0&&(s={},e.set(o,s)),s}function i(o){e.delete(o)}function r(o,s,l){e.get(o)[s]=l}function a(){e=new WeakMap}return{has:n,get:t,remove:i,update:r,dispose:a}}function Tu(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.material.id!==n.material.id?e.material.id-n.material.id:e.z!==n.z?e.z-n.z:e.id-n.id}function Ar(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.z!==n.z?n.z-e.z:e.id-n.id}function Rr(){const e=[];let n=0;const t=[],i=[],r=[];function a(){n=0,t.length=0,i.length=0,r.length=0}function o(h,_,S,D,C,d){let c=e[n];return c===void 0?(c={id:h.id,object:h,geometry:_,material:S,groupOrder:D,renderOrder:h.renderOrder,z:C,group:d},e[n]=c):(c.id=h.id,c.object=h,c.geometry=_,c.material=S,c.groupOrder=D,c.renderOrder=h.renderOrder,c.z=C,c.group=d),n++,c}function s(h,_,S,D,C,d){const c=o(h,_,S,D,C,d);S.transmission>0?i.push(c):S.transparent===!0?r.push(c):t.push(c)}function l(h,_,S,D,C,d){const c=o(h,_,S,D,C,d);S.transmission>0?i.unshift(c):S.transparent===!0?r.unshift(c):t.unshift(c)}function u(h,_){t.length>1&&t.sort(h||Tu),i.length>1&&i.sort(_||Ar),r.length>1&&r.sort(_||Ar)}function m(){for(let h=n,_=e.length;h<_;h++){const S=e[h];if(S.id===null)break;S.id=null,S.object=null,S.geometry=null,S.material=null,S.group=null}}return{opaque:t,transmissive:i,transparent:r,init:a,push:s,unshift:l,finish:m,sort:u}}function Mu(){let e=new WeakMap;function n(i,r){const a=e.get(i);let o;return a===void 0?(o=new Rr,e.set(i,[o])):r>=a.length?(o=new Rr,a.push(o)):o=a[r],o}function t(){e=new WeakMap}return{get:n,dispose:t}}function xu(){const e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"DirectionalLight":t={direction:new Fe,color:new Ge};break;case"SpotLight":t={position:new Fe,direction:new Fe,color:new Ge,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new Fe,color:new Ge,distance:0,decay:0};break;case"HemisphereLight":t={direction:new Fe,skyColor:new Ge,groundColor:new Ge};break;case"RectAreaLight":t={color:new Ge,position:new Fe,halfWidth:new Fe,halfHeight:new Fe};break}return e[n.id]=t,t}}}function Au(){const e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[n.id]=t,t}}}let Ru=0;function Cu(e,n){return(n.castShadow?2:0)-(e.castShadow?2:0)+(n.map?1:0)-(e.map?1:0)}function bu(e){const n=new xu,t=Au(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)i.probe.push(new Fe);const r=new Fe,a=new wt,o=new wt;function s(u){let m=0,h=0,_=0;for(let E=0;E<9;E++)i.probe[E].set(0,0,0);let S=0,D=0,C=0,d=0,c=0,w=0,A=0,M=0,N=0,L=0,I=0;u.sort(Cu);for(let E=0,g=u.length;E<g;E++){const P=u[E],B=P.color,X=P.intensity,K=P.distance,$=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)m+=B.r*X,h+=B.g*X,_+=B.b*X;else if(P.isLightProbe){for(let W=0;W<9;W++)i.probe[W].addScaledVector(P.sh.coefficients[W],X);I++}else if(P.isDirectionalLight){const W=n.get(P);if(W.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const ne=P.shadow,G=t.get(P);G.shadowIntensity=ne.intensity,G.shadowBias=ne.bias,G.shadowNormalBias=ne.normalBias,G.shadowRadius=ne.radius,G.shadowMapSize=ne.mapSize,i.directionalShadow[S]=G,i.directionalShadowMap[S]=$,i.directionalShadowMatrix[S]=P.shadow.matrix,w++}i.directional[S]=W,S++}else if(P.isSpotLight){const W=n.get(P);W.position.setFromMatrixPosition(P.matrixWorld),W.color.copy(B).multiplyScalar(X),W.distance=K,W.coneCos=Math.cos(P.angle),W.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),W.decay=P.decay,i.spot[C]=W;const ne=P.shadow;if(P.map&&(i.spotLightMap[N]=P.map,N++,ne.updateMatrices(P),P.castShadow&&L++),i.spotLightMatrix[C]=ne.matrix,P.castShadow){const G=t.get(P);G.shadowIntensity=ne.intensity,G.shadowBias=ne.bias,G.shadowNormalBias=ne.normalBias,G.shadowRadius=ne.radius,G.shadowMapSize=ne.mapSize,i.spotShadow[C]=G,i.spotShadowMap[C]=$,M++}C++}else if(P.isRectAreaLight){const W=n.get(P);W.color.copy(B).multiplyScalar(X),W.halfWidth.set(P.width*.5,0,0),W.halfHeight.set(0,P.height*.5,0),i.rectArea[d]=W,d++}else if(P.isPointLight){const W=n.get(P);if(W.color.copy(P.color).multiplyScalar(P.intensity),W.distance=P.distance,W.decay=P.decay,P.castShadow){const ne=P.shadow,G=t.get(P);G.shadowIntensity=ne.intensity,G.shadowBias=ne.bias,G.shadowNormalBias=ne.normalBias,G.shadowRadius=ne.radius,G.shadowMapSize=ne.mapSize,G.shadowCameraNear=ne.camera.near,G.shadowCameraFar=ne.camera.far,i.pointShadow[D]=G,i.pointShadowMap[D]=$,i.pointShadowMatrix[D]=P.shadow.matrix,A++}i.point[D]=W,D++}else if(P.isHemisphereLight){const W=n.get(P);W.skyColor.copy(P.color).multiplyScalar(X),W.groundColor.copy(P.groundColor).multiplyScalar(X),i.hemi[c]=W,c++}}d>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ie.LTC_FLOAT_1,i.rectAreaLTC2=ie.LTC_FLOAT_2):(i.rectAreaLTC1=ie.LTC_HALF_1,i.rectAreaLTC2=ie.LTC_HALF_2)),i.ambient[0]=m,i.ambient[1]=h,i.ambient[2]=_;const V=i.hash;(V.directionalLength!==S||V.pointLength!==D||V.spotLength!==C||V.rectAreaLength!==d||V.hemiLength!==c||V.numDirectionalShadows!==w||V.numPointShadows!==A||V.numSpotShadows!==M||V.numSpotMaps!==N||V.numLightProbes!==I)&&(i.directional.length=S,i.spot.length=C,i.rectArea.length=d,i.point.length=D,i.hemi.length=c,i.directionalShadow.length=w,i.directionalShadowMap.length=w,i.pointShadow.length=A,i.pointShadowMap.length=A,i.spotShadow.length=M,i.spotShadowMap.length=M,i.directionalShadowMatrix.length=w,i.pointShadowMatrix.length=A,i.spotLightMatrix.length=M+N-L,i.spotLightMap.length=N,i.numSpotLightShadowsWithMaps=L,i.numLightProbes=I,V.directionalLength=S,V.pointLength=D,V.spotLength=C,V.rectAreaLength=d,V.hemiLength=c,V.numDirectionalShadows=w,V.numPointShadows=A,V.numSpotShadows=M,V.numSpotMaps=N,V.numLightProbes=I,i.version=Ru++)}function l(u,m){let h=0,_=0,S=0,D=0,C=0;const d=m.matrixWorldInverse;for(let c=0,w=u.length;c<w;c++){const A=u[c];if(A.isDirectionalLight){const M=i.directional[h];M.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(d),h++}else if(A.isSpotLight){const M=i.spot[S];M.position.setFromMatrixPosition(A.matrixWorld),M.position.applyMatrix4(d),M.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(d),S++}else if(A.isRectAreaLight){const M=i.rectArea[D];M.position.setFromMatrixPosition(A.matrixWorld),M.position.applyMatrix4(d),o.identity(),a.copy(A.matrixWorld),a.premultiply(d),o.extractRotation(a),M.halfWidth.set(A.width*.5,0,0),M.halfHeight.set(0,A.height*.5,0),M.halfWidth.applyMatrix4(o),M.halfHeight.applyMatrix4(o),D++}else if(A.isPointLight){const M=i.point[_];M.position.setFromMatrixPosition(A.matrixWorld),M.position.applyMatrix4(d),_++}else if(A.isHemisphereLight){const M=i.hemi[C];M.direction.setFromMatrixPosition(A.matrixWorld),M.direction.transformDirection(d),C++}}}return{setup:s,setupView:l,state:i}}function Cr(e){const n=new bu(e),t=[],i=[];function r(m){u.camera=m,t.length=0,i.length=0}function a(m){t.push(m)}function o(m){i.push(m)}function s(){n.setup(t)}function l(m){n.setupView(t,m)}const u={lightsArray:t,shadowsArray:i,camera:null,lights:n,transmissionRenderTarget:{}};return{init:r,state:u,setupLights:s,setupLightsView:l,pushLight:a,pushShadow:o}}function Lu(e){let n=new WeakMap;function t(r,a=0){const o=n.get(r);let s;return o===void 0?(s=new Cr(e),n.set(r,[s])):a>=o.length?(s=new Cr(e),o.push(s)):s=o[a],s}function i(){n=new WeakMap}return{get:t,dispose:i}}const Pu=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,wu=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Du(e,n,t){let i=new Ur;const r=new ct,a=new ct,o=new dt,s=new $a({depthPacking:Za}),l=new ja,u={},m=t.maxTextureSize,h={[tn]:Et,[Et]:tn,[xt]:xt},_=new Kt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ct},radius:{value:4}},vertexShader:Pu,fragmentShader:wu}),S=_.clone();S.defines.HORIZONTAL_PASS=1;const D=new fi;D.setAttribute("position",new zt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const C=new Pt(D,_),d=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Br;let c=this.type;this.render=function(L,I,V){if(d.enabled===!1||d.autoUpdate===!1&&d.needsUpdate===!1||L.length===0)return;const E=e.getRenderTarget(),g=e.getActiveCubeFace(),P=e.getActiveMipmapLevel(),B=e.state;B.setBlending(Wt),B.buffers.depth.getReversed()===!0?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);const X=c!==Ct&&this.type===Ct,K=c===Ct&&this.type!==Ct;for(let $=0,W=L.length;$<W;$++){const ne=L[$],G=ne.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",ne,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;r.copy(G.mapSize);const ge=G.getFrameExtents();if(r.multiply(ge),a.copy(G.mapSize),(r.x>m||r.y>m)&&(r.x>m&&(a.x=Math.floor(m/ge.x),r.x=a.x*ge.x,G.mapSize.x=a.x),r.y>m&&(a.y=Math.floor(m/ge.y),r.y=a.y*ge.y,G.mapSize.y=a.y)),G.map===null||X===!0||K===!0){const De=this.type!==Ct?{minFilter:kt,magFilter:kt}:{};G.map!==null&&G.map.dispose(),G.map=new en(r.x,r.y,De),G.map.texture.name=ne.name+".shadowMap",G.camera.updateProjectionMatrix()}e.setRenderTarget(G.map),e.clear();const Me=G.getViewportCount();for(let De=0;De<Me;De++){const Ve=G.getViewport(De);o.set(a.x*Ve.x,a.y*Ve.y,a.x*Ve.z,a.y*Ve.w),B.viewport(o),G.updateMatrices(ne,De),i=G.getFrustum(),M(I,V,G.camera,ne,this.type)}G.isPointLightShadow!==!0&&this.type===Ct&&w(G,V),G.needsUpdate=!1}c=this.type,d.needsUpdate=!1,e.setRenderTarget(E,g,P)};function w(L,I){const V=n.update(C);_.defines.VSM_SAMPLES!==L.blurSamples&&(_.defines.VSM_SAMPLES=L.blurSamples,S.defines.VSM_SAMPLES=L.blurSamples,_.needsUpdate=!0,S.needsUpdate=!0),L.mapPass===null&&(L.mapPass=new en(r.x,r.y)),_.uniforms.shadow_pass.value=L.map.texture,_.uniforms.resolution.value=L.mapSize,_.uniforms.radius.value=L.radius,e.setRenderTarget(L.mapPass),e.clear(),e.renderBufferDirect(I,null,V,_,C,null),S.uniforms.shadow_pass.value=L.mapPass.texture,S.uniforms.resolution.value=L.mapSize,S.uniforms.radius.value=L.radius,e.setRenderTarget(L.map),e.clear(),e.renderBufferDirect(I,null,V,S,C,null)}function A(L,I,V,E){let g=null;const P=V.isPointLight===!0?L.customDistanceMaterial:L.customDepthMaterial;if(P!==void 0)g=P;else if(g=V.isPointLight===!0?l:s,e.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0||I.alphaToCoverage===!0){const B=g.uuid,X=I.uuid;let K=u[B];K===void 0&&(K={},u[B]=K);let $=K[X];$===void 0&&($=g.clone(),K[X]=$,I.addEventListener("dispose",N)),g=$}if(g.visible=I.visible,g.wireframe=I.wireframe,E===Ct?g.side=I.shadowSide!==null?I.shadowSide:I.side:g.side=I.shadowSide!==null?I.shadowSide:h[I.side],g.alphaMap=I.alphaMap,g.alphaTest=I.alphaToCoverage===!0?.5:I.alphaTest,g.map=I.map,g.clipShadows=I.clipShadows,g.clippingPlanes=I.clippingPlanes,g.clipIntersection=I.clipIntersection,g.displacementMap=I.displacementMap,g.displacementScale=I.displacementScale,g.displacementBias=I.displacementBias,g.wireframeLinewidth=I.wireframeLinewidth,g.linewidth=I.linewidth,V.isPointLight===!0&&g.isMeshDistanceMaterial===!0){const B=e.properties.get(g);B.light=V}return g}function M(L,I,V,E,g){if(L.visible===!1)return;if(L.layers.test(I.layers)&&(L.isMesh||L.isLine||L.isPoints)&&(L.castShadow||L.receiveShadow&&g===Ct)&&(!L.frustumCulled||i.intersectsObject(L))){L.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,L.matrixWorld);const X=n.update(L),K=L.material;if(Array.isArray(K)){const $=X.groups;for(let W=0,ne=$.length;W<ne;W++){const G=$[W],ge=K[G.materialIndex];if(ge&&ge.visible){const Me=A(L,ge,E,g);L.onBeforeShadow(e,L,I,V,X,Me,G),e.renderBufferDirect(V,null,X,Me,L,G),L.onAfterShadow(e,L,I,V,X,Me,G)}}}else if(K.visible){const $=A(L,K,E,g);L.onBeforeShadow(e,L,I,V,X,$,null),e.renderBufferDirect(V,null,X,$,L,null),L.onAfterShadow(e,L,I,V,X,$,null)}}const B=L.children;for(let X=0,K=B.length;X<K;X++)M(B[X],I,V,E,g)}function N(L){L.target.removeEventListener("dispose",N);for(const V in u){const E=u[V],g=L.target.uuid;g in E&&(E[g].dispose(),delete E[g])}}}const Uu={[ti]:ei,[Jn]:Zn,[Qn]:$n,[An]:jn,[ei]:ti,[Zn]:Jn,[$n]:Qn,[jn]:An};function Iu(e,n){function t(){let x=!1;const J=new dt;let te=null;const ce=new dt(0,0,0,0);return{setMask:function(Z){te!==Z&&!x&&(e.colorMask(Z,Z,Z,Z),te=Z)},setLocked:function(Z){x=Z},setClear:function(Z,z,ue,Le,Ke){Ke===!0&&(Z*=Le,z*=Le,ue*=Le),J.set(Z,z,ue,Le),ce.equals(J)===!1&&(e.clearColor(Z,z,ue,Le),ce.copy(J))},reset:function(){x=!1,te=null,ce.set(-1,0,0,0)}}}function i(){let x=!1,J=!1,te=null,ce=null,Z=null;return{setReversed:function(z){if(J!==z){const ue=n.get("EXT_clip_control");z?ue.clipControlEXT(ue.LOWER_LEFT_EXT,ue.ZERO_TO_ONE_EXT):ue.clipControlEXT(ue.LOWER_LEFT_EXT,ue.NEGATIVE_ONE_TO_ONE_EXT),J=z;const Le=Z;Z=null,this.setClear(Le)}},getReversed:function(){return J},setTest:function(z){z?q(e.DEPTH_TEST):le(e.DEPTH_TEST)},setMask:function(z){te!==z&&!x&&(e.depthMask(z),te=z)},setFunc:function(z){if(J&&(z=Uu[z]),ce!==z){switch(z){case ti:e.depthFunc(e.NEVER);break;case ei:e.depthFunc(e.ALWAYS);break;case Jn:e.depthFunc(e.LESS);break;case An:e.depthFunc(e.LEQUAL);break;case Qn:e.depthFunc(e.EQUAL);break;case jn:e.depthFunc(e.GEQUAL);break;case Zn:e.depthFunc(e.GREATER);break;case $n:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}ce=z}},setLocked:function(z){x=z},setClear:function(z){Z!==z&&(J&&(z=1-z),e.clearDepth(z),Z=z)},reset:function(){x=!1,te=null,ce=null,Z=null,J=!1}}}function r(){let x=!1,J=null,te=null,ce=null,Z=null,z=null,ue=null,Le=null,Ke=null;return{setTest:function(ke){x||(ke?q(e.STENCIL_TEST):le(e.STENCIL_TEST))},setMask:function(ke){J!==ke&&!x&&(e.stencilMask(ke),J=ke)},setFunc:function(ke,Rt,St){(te!==ke||ce!==Rt||Z!==St)&&(e.stencilFunc(ke,Rt,St),te=ke,ce=Rt,Z=St)},setOp:function(ke,Rt,St){(z!==ke||ue!==Rt||Le!==St)&&(e.stencilOp(ke,Rt,St),z=ke,ue=Rt,Le=St)},setLocked:function(ke){x=ke},setClear:function(ke){Ke!==ke&&(e.clearStencil(ke),Ke=ke)},reset:function(){x=!1,J=null,te=null,ce=null,Z=null,z=null,ue=null,Le=null,Ke=null}}}const a=new t,o=new i,s=new r,l=new WeakMap,u=new WeakMap;let m={},h={},_=new WeakMap,S=[],D=null,C=!1,d=null,c=null,w=null,A=null,M=null,N=null,L=null,I=new Ge(0,0,0),V=0,E=!1,g=null,P=null,B=null,X=null,K=null;const $=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let W=!1,ne=0;const G=e.getParameter(e.VERSION);G.indexOf("WebGL")!==-1?(ne=parseFloat(/^WebGL (\d)/.exec(G)[1]),W=ne>=1):G.indexOf("OpenGL ES")!==-1&&(ne=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),W=ne>=2);let ge=null,Me={};const De=e.getParameter(e.SCISSOR_BOX),Ve=e.getParameter(e.VIEWPORT),nt=new dt().fromArray(De),Je=new dt().fromArray(Ve);function We(x,J,te,ce){const Z=new Uint8Array(4),z=e.createTexture();e.bindTexture(x,z),e.texParameteri(x,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(x,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let ue=0;ue<te;ue++)x===e.TEXTURE_3D||x===e.TEXTURE_2D_ARRAY?e.texImage3D(J,0,e.RGBA,1,1,ce,0,e.RGBA,e.UNSIGNED_BYTE,Z):e.texImage2D(J+ue,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,Z);return z}const k={};k[e.TEXTURE_2D]=We(e.TEXTURE_2D,e.TEXTURE_2D,1),k[e.TEXTURE_CUBE_MAP]=We(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),k[e.TEXTURE_2D_ARRAY]=We(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),k[e.TEXTURE_3D]=We(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),q(e.DEPTH_TEST),o.setFunc(An),Re(!1),de(Yi),q(e.CULL_FACE),$e(Wt);function q(x){m[x]!==!0&&(e.enable(x),m[x]=!0)}function le(x){m[x]!==!1&&(e.disable(x),m[x]=!1)}function be(x,J){return h[x]!==J?(e.bindFramebuffer(x,J),h[x]=J,x===e.DRAW_FRAMEBUFFER&&(h[e.FRAMEBUFFER]=J),x===e.FRAMEBUFFER&&(h[e.DRAW_FRAMEBUFFER]=J),!0):!1}function Ee(x,J){let te=S,ce=!1;if(x){te=_.get(J),te===void 0&&(te=[],_.set(J,te));const Z=x.textures;if(te.length!==Z.length||te[0]!==e.COLOR_ATTACHMENT0){for(let z=0,ue=Z.length;z<ue;z++)te[z]=e.COLOR_ATTACHMENT0+z;te.length=Z.length,ce=!0}}else te[0]!==e.BACK&&(te[0]=e.BACK,ce=!0);ce&&e.drawBuffers(te)}function Oe(x){return D!==x?(e.useProgram(x),D=x,!0):!1}const st={[on]:e.FUNC_ADD,[Ra]:e.FUNC_SUBTRACT,[Aa]:e.FUNC_REVERSE_SUBTRACT};st[Uo]=e.MIN,st[Io]=e.MAX;const T={[Ga]:e.ZERO,[Ha]:e.ONE,[Ba]:e.SRC_COLOR,[Fa]:e.SRC_ALPHA,[Oa]:e.SRC_ALPHA_SATURATE,[ya]:e.DST_COLOR,[Na]:e.DST_ALPHA,[Ia]:e.ONE_MINUS_SRC_COLOR,[Ua]:e.ONE_MINUS_SRC_ALPHA,[Da]:e.ONE_MINUS_DST_COLOR,[wa]:e.ONE_MINUS_DST_ALPHA,[Pa]:e.CONSTANT_COLOR,[La]:e.ONE_MINUS_CONSTANT_COLOR,[ba]:e.CONSTANT_ALPHA,[Ca]:e.ONE_MINUS_CONSTANT_ALPHA};function $e(x,J,te,ce,Z,z,ue,Le,Ke,ke){if(x===Wt){C===!0&&(le(e.BLEND),C=!1);return}if(C===!1&&(q(e.BLEND),C=!0),x!==co){if(x!==d||ke!==E){if((c!==on||M!==on)&&(e.blendEquation(e.FUNC_ADD),c=on,M=on),ke)switch(x){case Tn:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Zi:e.blendFunc(e.ONE,e.ONE);break;case $i:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case qi:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",x);break}else switch(x){case Tn:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Zi:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case $i:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case qi:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",x);break}w=null,A=null,N=null,L=null,I.set(0,0,0),V=0,d=x,E=ke}return}Z=Z||J,z=z||te,ue=ue||ce,(J!==c||Z!==M)&&(e.blendEquationSeparate(st[J],st[Z]),c=J,M=Z),(te!==w||ce!==A||z!==N||ue!==L)&&(e.blendFuncSeparate(T[te],T[ce],T[z],T[ue]),w=te,A=ce,N=z,L=ue),(Le.equals(I)===!1||Ke!==V)&&(e.blendColor(Le.r,Le.g,Le.b,Ke),I.copy(Le),V=Ke),d=x,E=!1}function Pe(x,J){x.side===xt?le(e.CULL_FACE):q(e.CULL_FACE);let te=x.side===Et;J&&(te=!te),Re(te),x.blending===Tn&&x.transparent===!1?$e(Wt):$e(x.blending,x.blendEquation,x.blendSrc,x.blendDst,x.blendEquationAlpha,x.blendSrcAlpha,x.blendDstAlpha,x.blendColor,x.blendAlpha,x.premultipliedAlpha),o.setFunc(x.depthFunc),o.setTest(x.depthTest),o.setMask(x.depthWrite),a.setMask(x.colorWrite);const ce=x.stencilWrite;s.setTest(ce),ce&&(s.setMask(x.stencilWriteMask),s.setFunc(x.stencilFunc,x.stencilRef,x.stencilFuncMask),s.setOp(x.stencilFail,x.stencilZFail,x.stencilZPass)),pe(x.polygonOffset,x.polygonOffsetFactor,x.polygonOffsetUnits),x.alphaToCoverage===!0?q(e.SAMPLE_ALPHA_TO_COVERAGE):le(e.SAMPLE_ALPHA_TO_COVERAGE)}function Re(x){g!==x&&(x?e.frontFace(e.CW):e.frontFace(e.CCW),g=x)}function de(x){x!==oo?(q(e.CULL_FACE),x!==P&&(x===Yi?e.cullFace(e.BACK):x===so?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):le(e.CULL_FACE),P=x}function Ze(x){x!==B&&(W&&e.lineWidth(x),B=x)}function pe(x,J,te){x?(q(e.POLYGON_OFFSET_FILL),(X!==J||K!==te)&&(e.polygonOffset(J,te),X=J,K=te)):le(e.POLYGON_OFFSET_FILL)}function Ue(x){x?q(e.SCISSOR_TEST):le(e.SCISSOR_TEST)}function ot(x){x===void 0&&(x=e.TEXTURE0+$-1),ge!==x&&(e.activeTexture(x),ge=x)}function it(x,J,te){te===void 0&&(ge===null?te=e.TEXTURE0+$-1:te=ge);let ce=Me[te];ce===void 0&&(ce={type:void 0,texture:void 0},Me[te]=ce),(ce.type!==x||ce.texture!==J)&&(ge!==te&&(e.activeTexture(te),ge=te),e.bindTexture(x,J||k[x]),ce.type=x,ce.texture=J)}function v(){const x=Me[ge];x!==void 0&&x.type!==void 0&&(e.bindTexture(x.type,null),x.type=void 0,x.texture=void 0)}function f(){try{e.compressedTexImage2D(...arguments)}catch(x){console.error("THREE.WebGLState:",x)}}function U(){try{e.compressedTexImage3D(...arguments)}catch(x){console.error("THREE.WebGLState:",x)}}function H(){try{e.texSubImage2D(...arguments)}catch(x){console.error("THREE.WebGLState:",x)}}function Y(){try{e.texSubImage3D(...arguments)}catch(x){console.error("THREE.WebGLState:",x)}}function F(){try{e.compressedTexSubImage2D(...arguments)}catch(x){console.error("THREE.WebGLState:",x)}}function ve(){try{e.compressedTexSubImage3D(...arguments)}catch(x){console.error("THREE.WebGLState:",x)}}function ee(){try{e.texStorage2D(...arguments)}catch(x){console.error("THREE.WebGLState:",x)}}function he(){try{e.texStorage3D(...arguments)}catch(x){console.error("THREE.WebGLState:",x)}}function me(){try{e.texImage2D(...arguments)}catch(x){console.error("THREE.WebGLState:",x)}}function Q(){try{e.texImage3D(...arguments)}catch(x){console.error("THREE.WebGLState:",x)}}function oe(x){nt.equals(x)===!1&&(e.scissor(x.x,x.y,x.z,x.w),nt.copy(x))}function Ae(x){Je.equals(x)===!1&&(e.viewport(x.x,x.y,x.z,x.w),Je.copy(x))}function _e(x,J){let te=u.get(J);te===void 0&&(te=new WeakMap,u.set(J,te));let ce=te.get(x);ce===void 0&&(ce=e.getUniformBlockIndex(J,x.name),te.set(x,ce))}function re(x,J){const ce=u.get(J).get(x);l.get(J)!==ce&&(e.uniformBlockBinding(J,ce,x.__bindingPointIndex),l.set(J,ce))}function we(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),m={},ge=null,Me={},h={},_=new WeakMap,S=[],D=null,C=!1,d=null,c=null,w=null,A=null,M=null,N=null,L=null,I=new Ge(0,0,0),V=0,E=!1,g=null,P=null,B=null,X=null,K=null,nt.set(0,0,e.canvas.width,e.canvas.height),Je.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:q,disable:le,bindFramebuffer:be,drawBuffers:Ee,useProgram:Oe,setBlending:$e,setMaterial:Pe,setFlipSided:Re,setCullFace:de,setLineWidth:Ze,setPolygonOffset:pe,setScissorTest:Ue,activeTexture:ot,bindTexture:it,unbindTexture:v,compressedTexImage2D:f,compressedTexImage3D:U,texImage2D:me,texImage3D:Q,updateUBOMapping:_e,uniformBlockBinding:re,texStorage2D:ee,texStorage3D:he,texSubImage2D:H,texSubImage3D:Y,compressedTexSubImage2D:F,compressedTexSubImage3D:ve,scissor:oe,viewport:Ae,reset:we}}function Nu(e,n,t,i,r,a,o){const s=n.has("WEBGL_multisampled_render_to_texture")?n.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new ct,m=new WeakMap;let h;const _=new WeakMap;let S=!1;try{S=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function D(v,f){return S?new OffscreenCanvas(v,f):Lo("canvas")}function C(v,f,U){let H=1;const Y=it(v);if((Y.width>U||Y.height>U)&&(H=U/Math.max(Y.width,Y.height)),H<1)if(typeof HTMLImageElement<"u"&&v instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&v instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&v instanceof ImageBitmap||typeof VideoFrame<"u"&&v instanceof VideoFrame){const F=Math.floor(H*Y.width),ve=Math.floor(H*Y.height);h===void 0&&(h=D(F,ve));const ee=f?D(F,ve):h;return ee.width=F,ee.height=ve,ee.getContext("2d").drawImage(v,0,0,F,ve),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Y.width+"x"+Y.height+") to ("+F+"x"+ve+")."),ee}else return"data"in v&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Y.width+"x"+Y.height+")."),v;return v}function d(v){return v.generateMipmaps}function c(v){e.generateMipmap(v)}function w(v){return v.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:v.isWebGL3DRenderTarget?e.TEXTURE_3D:v.isWebGLArrayRenderTarget||v.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function A(v,f,U,H,Y=!1){if(v!==null){if(e[v]!==void 0)return e[v];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+v+"'")}let F=f;if(f===e.RED&&(U===e.FLOAT&&(F=e.R32F),U===e.HALF_FLOAT&&(F=e.R16F),U===e.UNSIGNED_BYTE&&(F=e.R8)),f===e.RED_INTEGER&&(U===e.UNSIGNED_BYTE&&(F=e.R8UI),U===e.UNSIGNED_SHORT&&(F=e.R16UI),U===e.UNSIGNED_INT&&(F=e.R32UI),U===e.BYTE&&(F=e.R8I),U===e.SHORT&&(F=e.R16I),U===e.INT&&(F=e.R32I)),f===e.RG&&(U===e.FLOAT&&(F=e.RG32F),U===e.HALF_FLOAT&&(F=e.RG16F),U===e.UNSIGNED_BYTE&&(F=e.RG8)),f===e.RG_INTEGER&&(U===e.UNSIGNED_BYTE&&(F=e.RG8UI),U===e.UNSIGNED_SHORT&&(F=e.RG16UI),U===e.UNSIGNED_INT&&(F=e.RG32UI),U===e.BYTE&&(F=e.RG8I),U===e.SHORT&&(F=e.RG16I),U===e.INT&&(F=e.RG32I)),f===e.RGB_INTEGER&&(U===e.UNSIGNED_BYTE&&(F=e.RGB8UI),U===e.UNSIGNED_SHORT&&(F=e.RGB16UI),U===e.UNSIGNED_INT&&(F=e.RGB32UI),U===e.BYTE&&(F=e.RGB8I),U===e.SHORT&&(F=e.RGB16I),U===e.INT&&(F=e.RGB32I)),f===e.RGBA_INTEGER&&(U===e.UNSIGNED_BYTE&&(F=e.RGBA8UI),U===e.UNSIGNED_SHORT&&(F=e.RGBA16UI),U===e.UNSIGNED_INT&&(F=e.RGBA32UI),U===e.BYTE&&(F=e.RGBA8I),U===e.SHORT&&(F=e.RGBA16I),U===e.INT&&(F=e.RGBA32I)),f===e.RGB&&(U===e.UNSIGNED_INT_5_9_9_9_REV&&(F=e.RGB9_E5),U===e.UNSIGNED_INT_10F_11F_11F_REV&&(F=e.R11F_G11F_B10F)),f===e.RGBA){const ve=Y?jr:tt.getTransfer(H);U===e.FLOAT&&(F=e.RGBA32F),U===e.HALF_FLOAT&&(F=e.RGBA16F),U===e.UNSIGNED_BYTE&&(F=ve===qe?e.SRGB8_ALPHA8:e.RGBA8),U===e.UNSIGNED_SHORT_4_4_4_4&&(F=e.RGBA4),U===e.UNSIGNED_SHORT_5_5_5_1&&(F=e.RGB5_A1)}return(F===e.R16F||F===e.R32F||F===e.RG16F||F===e.RG32F||F===e.RGBA16F||F===e.RGBA32F)&&n.get("EXT_color_buffer_float"),F}function M(v,f){let U;return v?f===null||f===pn||f===dn?U=e.DEPTH24_STENCIL8:f===Vt?U=e.DEPTH32F_STENCIL8:f===Cn&&(U=e.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):f===null||f===pn||f===dn?U=e.DEPTH_COMPONENT24:f===Vt?U=e.DEPTH_COMPONENT32F:f===Cn&&(U=e.DEPTH_COMPONENT16),U}function N(v,f){return d(v)===!0||v.isFramebufferTexture&&v.minFilter!==kt&&v.minFilter!==Lt?Math.log2(Math.max(f.width,f.height))+1:v.mipmaps!==void 0&&v.mipmaps.length>0?v.mipmaps.length:v.isCompressedTexture&&Array.isArray(v.image)?f.mipmaps.length:1}function L(v){const f=v.target;f.removeEventListener("dispose",L),V(f),f.isVideoTexture&&m.delete(f)}function I(v){const f=v.target;f.removeEventListener("dispose",I),g(f)}function V(v){const f=i.get(v);if(f.__webglInit===void 0)return;const U=v.source,H=_.get(U);if(H){const Y=H[f.__cacheKey];Y.usedTimes--,Y.usedTimes===0&&E(v),Object.keys(H).length===0&&_.delete(U)}i.remove(v)}function E(v){const f=i.get(v);e.deleteTexture(f.__webglTexture);const U=v.source,H=_.get(U);delete H[f.__cacheKey],o.memory.textures--}function g(v){const f=i.get(v);if(v.depthTexture&&(v.depthTexture.dispose(),i.remove(v.depthTexture)),v.isWebGLCubeRenderTarget)for(let H=0;H<6;H++){if(Array.isArray(f.__webglFramebuffer[H]))for(let Y=0;Y<f.__webglFramebuffer[H].length;Y++)e.deleteFramebuffer(f.__webglFramebuffer[H][Y]);else e.deleteFramebuffer(f.__webglFramebuffer[H]);f.__webglDepthbuffer&&e.deleteRenderbuffer(f.__webglDepthbuffer[H])}else{if(Array.isArray(f.__webglFramebuffer))for(let H=0;H<f.__webglFramebuffer.length;H++)e.deleteFramebuffer(f.__webglFramebuffer[H]);else e.deleteFramebuffer(f.__webglFramebuffer);if(f.__webglDepthbuffer&&e.deleteRenderbuffer(f.__webglDepthbuffer),f.__webglMultisampledFramebuffer&&e.deleteFramebuffer(f.__webglMultisampledFramebuffer),f.__webglColorRenderbuffer)for(let H=0;H<f.__webglColorRenderbuffer.length;H++)f.__webglColorRenderbuffer[H]&&e.deleteRenderbuffer(f.__webglColorRenderbuffer[H]);f.__webglDepthRenderbuffer&&e.deleteRenderbuffer(f.__webglDepthRenderbuffer)}const U=v.textures;for(let H=0,Y=U.length;H<Y;H++){const F=i.get(U[H]);F.__webglTexture&&(e.deleteTexture(F.__webglTexture),o.memory.textures--),i.remove(U[H])}i.remove(v)}let P=0;function B(){P=0}function X(){const v=P;return v>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+v+" texture units while this GPU supports only "+r.maxTextures),P+=1,v}function K(v){const f=[];return f.push(v.wrapS),f.push(v.wrapT),f.push(v.wrapR||0),f.push(v.magFilter),f.push(v.minFilter),f.push(v.anisotropy),f.push(v.internalFormat),f.push(v.format),f.push(v.type),f.push(v.generateMipmaps),f.push(v.premultiplyAlpha),f.push(v.flipY),f.push(v.unpackAlignment),f.push(v.colorSpace),f.join()}function $(v,f){const U=i.get(v);if(v.isVideoTexture&&Ue(v),v.isRenderTargetTexture===!1&&v.isExternalTexture!==!0&&v.version>0&&U.__version!==v.version){const H=v.image;if(H===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(H.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{k(U,v,f);return}}else v.isExternalTexture&&(U.__webglTexture=v.sourceTexture?v.sourceTexture:null);t.bindTexture(e.TEXTURE_2D,U.__webglTexture,e.TEXTURE0+f)}function W(v,f){const U=i.get(v);if(v.isRenderTargetTexture===!1&&v.version>0&&U.__version!==v.version){k(U,v,f);return}t.bindTexture(e.TEXTURE_2D_ARRAY,U.__webglTexture,e.TEXTURE0+f)}function ne(v,f){const U=i.get(v);if(v.isRenderTargetTexture===!1&&v.version>0&&U.__version!==v.version){k(U,v,f);return}t.bindTexture(e.TEXTURE_3D,U.__webglTexture,e.TEXTURE0+f)}function G(v,f){const U=i.get(v);if(v.version>0&&U.__version!==v.version){q(U,v,f);return}t.bindTexture(e.TEXTURE_CUBE_MAP,U.__webglTexture,e.TEXTURE0+f)}const ge={[Rn]:e.REPEAT,[yr]:e.CLAMP_TO_EDGE,[Nr]:e.MIRRORED_REPEAT},Me={[kt]:e.NEAREST,[Or]:e.NEAREST_MIPMAP_NEAREST,[cn]:e.NEAREST_MIPMAP_LINEAR,[Lt]:e.LINEAR,[Sn]:e.LINEAR_MIPMAP_NEAREST,[Gt]:e.LINEAR_MIPMAP_LINEAR},De={[Ya]:e.NEVER,[Ka]:e.ALWAYS,[Xa]:e.LESS,[Fr]:e.LEQUAL,[Wa]:e.EQUAL,[za]:e.GEQUAL,[ka]:e.GREATER,[Va]:e.NOTEQUAL};function Ve(v,f){if(f.type===Vt&&n.has("OES_texture_float_linear")===!1&&(f.magFilter===Lt||f.magFilter===Sn||f.magFilter===cn||f.magFilter===Gt||f.minFilter===Lt||f.minFilter===Sn||f.minFilter===cn||f.minFilter===Gt)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(v,e.TEXTURE_WRAP_S,ge[f.wrapS]),e.texParameteri(v,e.TEXTURE_WRAP_T,ge[f.wrapT]),(v===e.TEXTURE_3D||v===e.TEXTURE_2D_ARRAY)&&e.texParameteri(v,e.TEXTURE_WRAP_R,ge[f.wrapR]),e.texParameteri(v,e.TEXTURE_MAG_FILTER,Me[f.magFilter]),e.texParameteri(v,e.TEXTURE_MIN_FILTER,Me[f.minFilter]),f.compareFunction&&(e.texParameteri(v,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(v,e.TEXTURE_COMPARE_FUNC,De[f.compareFunction])),n.has("EXT_texture_filter_anisotropic")===!0){if(f.magFilter===kt||f.minFilter!==cn&&f.minFilter!==Gt||f.type===Vt&&n.has("OES_texture_float_linear")===!1)return;if(f.anisotropy>1||i.get(f).__currentAnisotropy){const U=n.get("EXT_texture_filter_anisotropic");e.texParameterf(v,U.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(f.anisotropy,r.getMaxAnisotropy())),i.get(f).__currentAnisotropy=f.anisotropy}}}function nt(v,f){let U=!1;v.__webglInit===void 0&&(v.__webglInit=!0,f.addEventListener("dispose",L));const H=f.source;let Y=_.get(H);Y===void 0&&(Y={},_.set(H,Y));const F=K(f);if(F!==v.__cacheKey){Y[F]===void 0&&(Y[F]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,U=!0),Y[F].usedTimes++;const ve=Y[v.__cacheKey];ve!==void 0&&(Y[v.__cacheKey].usedTimes--,ve.usedTimes===0&&E(f)),v.__cacheKey=F,v.__webglTexture=Y[F].texture}return U}function Je(v,f,U){return Math.floor(Math.floor(v/U)/f)}function We(v,f,U,H){const F=v.updateRanges;if(F.length===0)t.texSubImage2D(e.TEXTURE_2D,0,0,0,f.width,f.height,U,H,f.data);else{F.sort((Q,oe)=>Q.start-oe.start);let ve=0;for(let Q=1;Q<F.length;Q++){const oe=F[ve],Ae=F[Q],_e=oe.start+oe.count,re=Je(Ae.start,f.width,4),we=Je(oe.start,f.width,4);Ae.start<=_e+1&&re===we&&Je(Ae.start+Ae.count-1,f.width,4)===re?oe.count=Math.max(oe.count,Ae.start+Ae.count-oe.start):(++ve,F[ve]=Ae)}F.length=ve+1;const ee=e.getParameter(e.UNPACK_ROW_LENGTH),he=e.getParameter(e.UNPACK_SKIP_PIXELS),me=e.getParameter(e.UNPACK_SKIP_ROWS);e.pixelStorei(e.UNPACK_ROW_LENGTH,f.width);for(let Q=0,oe=F.length;Q<oe;Q++){const Ae=F[Q],_e=Math.floor(Ae.start/4),re=Math.ceil(Ae.count/4),we=_e%f.width,x=Math.floor(_e/f.width),J=re,te=1;e.pixelStorei(e.UNPACK_SKIP_PIXELS,we),e.pixelStorei(e.UNPACK_SKIP_ROWS,x),t.texSubImage2D(e.TEXTURE_2D,0,we,x,J,te,U,H,f.data)}v.clearUpdateRanges(),e.pixelStorei(e.UNPACK_ROW_LENGTH,ee),e.pixelStorei(e.UNPACK_SKIP_PIXELS,he),e.pixelStorei(e.UNPACK_SKIP_ROWS,me)}}function k(v,f,U){let H=e.TEXTURE_2D;(f.isDataArrayTexture||f.isCompressedArrayTexture)&&(H=e.TEXTURE_2D_ARRAY),f.isData3DTexture&&(H=e.TEXTURE_3D);const Y=nt(v,f),F=f.source;t.bindTexture(H,v.__webglTexture,e.TEXTURE0+U);const ve=i.get(F);if(F.version!==ve.__version||Y===!0){t.activeTexture(e.TEXTURE0+U);const ee=tt.getPrimaries(tt.workingColorSpace),he=f.colorSpace===$t?null:tt.getPrimaries(f.colorSpace),me=f.colorSpace===$t||ee===he?e.NONE:e.BROWSER_DEFAULT_WEBGL;e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,f.flipY),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,f.premultiplyAlpha),e.pixelStorei(e.UNPACK_ALIGNMENT,f.unpackAlignment),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,me);let Q=C(f.image,!1,r.maxTextureSize);Q=ot(f,Q);const oe=a.convert(f.format,f.colorSpace),Ae=a.convert(f.type);let _e=A(f.internalFormat,oe,Ae,f.colorSpace,f.isVideoTexture);Ve(H,f);let re;const we=f.mipmaps,x=f.isVideoTexture!==!0,J=ve.__version===void 0||Y===!0,te=F.dataReady,ce=N(f,Q);if(f.isDepthTexture)_e=M(f.format===xn,f.type),J&&(x?t.texStorage2D(e.TEXTURE_2D,1,_e,Q.width,Q.height):t.texImage2D(e.TEXTURE_2D,0,_e,Q.width,Q.height,0,oe,Ae,null));else if(f.isDataTexture)if(we.length>0){x&&J&&t.texStorage2D(e.TEXTURE_2D,ce,_e,we[0].width,we[0].height);for(let Z=0,z=we.length;Z<z;Z++)re=we[Z],x?te&&t.texSubImage2D(e.TEXTURE_2D,Z,0,0,re.width,re.height,oe,Ae,re.data):t.texImage2D(e.TEXTURE_2D,Z,_e,re.width,re.height,0,oe,Ae,re.data);f.generateMipmaps=!1}else x?(J&&t.texStorage2D(e.TEXTURE_2D,ce,_e,Q.width,Q.height),te&&We(f,Q,oe,Ae)):t.texImage2D(e.TEXTURE_2D,0,_e,Q.width,Q.height,0,oe,Ae,Q.data);else if(f.isCompressedTexture)if(f.isCompressedArrayTexture){x&&J&&t.texStorage3D(e.TEXTURE_2D_ARRAY,ce,_e,we[0].width,we[0].height,Q.depth);for(let Z=0,z=we.length;Z<z;Z++)if(re=we[Z],f.format!==bt)if(oe!==null)if(x){if(te)if(f.layerUpdates.size>0){const ue=Qi(re.width,re.height,f.format,f.type);for(const Le of f.layerUpdates){const Ke=re.data.subarray(Le*ue/re.data.BYTES_PER_ELEMENT,(Le+1)*ue/re.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Z,0,0,Le,re.width,re.height,1,oe,Ke)}f.clearLayerUpdates()}else t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Z,0,0,0,re.width,re.height,Q.depth,oe,re.data)}else t.compressedTexImage3D(e.TEXTURE_2D_ARRAY,Z,_e,re.width,re.height,Q.depth,0,re.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else x?te&&t.texSubImage3D(e.TEXTURE_2D_ARRAY,Z,0,0,0,re.width,re.height,Q.depth,oe,Ae,re.data):t.texImage3D(e.TEXTURE_2D_ARRAY,Z,_e,re.width,re.height,Q.depth,0,oe,Ae,re.data)}else{x&&J&&t.texStorage2D(e.TEXTURE_2D,ce,_e,we[0].width,we[0].height);for(let Z=0,z=we.length;Z<z;Z++)re=we[Z],f.format!==bt?oe!==null?x?te&&t.compressedTexSubImage2D(e.TEXTURE_2D,Z,0,0,re.width,re.height,oe,re.data):t.compressedTexImage2D(e.TEXTURE_2D,Z,_e,re.width,re.height,0,re.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):x?te&&t.texSubImage2D(e.TEXTURE_2D,Z,0,0,re.width,re.height,oe,Ae,re.data):t.texImage2D(e.TEXTURE_2D,Z,_e,re.width,re.height,0,oe,Ae,re.data)}else if(f.isDataArrayTexture)if(x){if(J&&t.texStorage3D(e.TEXTURE_2D_ARRAY,ce,_e,Q.width,Q.height,Q.depth),te)if(f.layerUpdates.size>0){const Z=Qi(Q.width,Q.height,f.format,f.type);for(const z of f.layerUpdates){const ue=Q.data.subarray(z*Z/Q.data.BYTES_PER_ELEMENT,(z+1)*Z/Q.data.BYTES_PER_ELEMENT);t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,z,Q.width,Q.height,1,oe,Ae,ue)}f.clearLayerUpdates()}else t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,oe,Ae,Q.data)}else t.texImage3D(e.TEXTURE_2D_ARRAY,0,_e,Q.width,Q.height,Q.depth,0,oe,Ae,Q.data);else if(f.isData3DTexture)x?(J&&t.texStorage3D(e.TEXTURE_3D,ce,_e,Q.width,Q.height,Q.depth),te&&t.texSubImage3D(e.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,oe,Ae,Q.data)):t.texImage3D(e.TEXTURE_3D,0,_e,Q.width,Q.height,Q.depth,0,oe,Ae,Q.data);else if(f.isFramebufferTexture){if(J)if(x)t.texStorage2D(e.TEXTURE_2D,ce,_e,Q.width,Q.height);else{let Z=Q.width,z=Q.height;for(let ue=0;ue<ce;ue++)t.texImage2D(e.TEXTURE_2D,ue,_e,Z,z,0,oe,Ae,null),Z>>=1,z>>=1}}else if(we.length>0){if(x&&J){const Z=it(we[0]);t.texStorage2D(e.TEXTURE_2D,ce,_e,Z.width,Z.height)}for(let Z=0,z=we.length;Z<z;Z++)re=we[Z],x?te&&t.texSubImage2D(e.TEXTURE_2D,Z,0,0,oe,Ae,re):t.texImage2D(e.TEXTURE_2D,Z,_e,oe,Ae,re);f.generateMipmaps=!1}else if(x){if(J){const Z=it(Q);t.texStorage2D(e.TEXTURE_2D,ce,_e,Z.width,Z.height)}te&&t.texSubImage2D(e.TEXTURE_2D,0,0,0,oe,Ae,Q)}else t.texImage2D(e.TEXTURE_2D,0,_e,oe,Ae,Q);d(f)&&c(H),ve.__version=F.version,f.onUpdate&&f.onUpdate(f)}v.__version=f.version}function q(v,f,U){if(f.image.length!==6)return;const H=nt(v,f),Y=f.source;t.bindTexture(e.TEXTURE_CUBE_MAP,v.__webglTexture,e.TEXTURE0+U);const F=i.get(Y);if(Y.version!==F.__version||H===!0){t.activeTexture(e.TEXTURE0+U);const ve=tt.getPrimaries(tt.workingColorSpace),ee=f.colorSpace===$t?null:tt.getPrimaries(f.colorSpace),he=f.colorSpace===$t||ve===ee?e.NONE:e.BROWSER_DEFAULT_WEBGL;e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,f.flipY),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,f.premultiplyAlpha),e.pixelStorei(e.UNPACK_ALIGNMENT,f.unpackAlignment),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,he);const me=f.isCompressedTexture||f.image[0].isCompressedTexture,Q=f.image[0]&&f.image[0].isDataTexture,oe=[];for(let z=0;z<6;z++)!me&&!Q?oe[z]=C(f.image[z],!0,r.maxCubemapSize):oe[z]=Q?f.image[z].image:f.image[z],oe[z]=ot(f,oe[z]);const Ae=oe[0],_e=a.convert(f.format,f.colorSpace),re=a.convert(f.type),we=A(f.internalFormat,_e,re,f.colorSpace),x=f.isVideoTexture!==!0,J=F.__version===void 0||H===!0,te=Y.dataReady;let ce=N(f,Ae);Ve(e.TEXTURE_CUBE_MAP,f);let Z;if(me){x&&J&&t.texStorage2D(e.TEXTURE_CUBE_MAP,ce,we,Ae.width,Ae.height);for(let z=0;z<6;z++){Z=oe[z].mipmaps;for(let ue=0;ue<Z.length;ue++){const Le=Z[ue];f.format!==bt?_e!==null?x?te&&t.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,ue,0,0,Le.width,Le.height,_e,Le.data):t.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,ue,we,Le.width,Le.height,0,Le.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):x?te&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,ue,0,0,Le.width,Le.height,_e,re,Le.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,ue,we,Le.width,Le.height,0,_e,re,Le.data)}}}else{if(Z=f.mipmaps,x&&J){Z.length>0&&ce++;const z=it(oe[0]);t.texStorage2D(e.TEXTURE_CUBE_MAP,ce,we,z.width,z.height)}for(let z=0;z<6;z++)if(Q){x?te&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,0,0,0,oe[z].width,oe[z].height,_e,re,oe[z].data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,0,we,oe[z].width,oe[z].height,0,_e,re,oe[z].data);for(let ue=0;ue<Z.length;ue++){const Ke=Z[ue].image[z].image;x?te&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,ue+1,0,0,Ke.width,Ke.height,_e,re,Ke.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,ue+1,we,Ke.width,Ke.height,0,_e,re,Ke.data)}}else{x?te&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,0,0,0,_e,re,oe[z]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,0,we,_e,re,oe[z]);for(let ue=0;ue<Z.length;ue++){const Le=Z[ue];x?te&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,ue+1,0,0,_e,re,Le.image[z]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+z,ue+1,we,_e,re,Le.image[z])}}}d(f)&&c(e.TEXTURE_CUBE_MAP),F.__version=Y.version,f.onUpdate&&f.onUpdate(f)}v.__version=f.version}function le(v,f,U,H,Y,F){const ve=a.convert(U.format,U.colorSpace),ee=a.convert(U.type),he=A(U.internalFormat,ve,ee,U.colorSpace),me=i.get(f),Q=i.get(U);if(Q.__renderTarget=f,!me.__hasExternalTextures){const oe=Math.max(1,f.width>>F),Ae=Math.max(1,f.height>>F);Y===e.TEXTURE_3D||Y===e.TEXTURE_2D_ARRAY?t.texImage3D(Y,F,he,oe,Ae,f.depth,0,ve,ee,null):t.texImage2D(Y,F,he,oe,Ae,0,ve,ee,null)}t.bindFramebuffer(e.FRAMEBUFFER,v),pe(f)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,H,Y,Q.__webglTexture,0,Ze(f)):(Y===e.TEXTURE_2D||Y>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&Y<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,H,Y,Q.__webglTexture,F),t.bindFramebuffer(e.FRAMEBUFFER,null)}function be(v,f,U){if(e.bindRenderbuffer(e.RENDERBUFFER,v),f.depthBuffer){const H=f.depthTexture,Y=H&&H.isDepthTexture?H.type:null,F=M(f.stencilBuffer,Y),ve=f.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ee=Ze(f);pe(f)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ee,F,f.width,f.height):U?e.renderbufferStorageMultisample(e.RENDERBUFFER,ee,F,f.width,f.height):e.renderbufferStorage(e.RENDERBUFFER,F,f.width,f.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,ve,e.RENDERBUFFER,v)}else{const H=f.textures;for(let Y=0;Y<H.length;Y++){const F=H[Y],ve=a.convert(F.format,F.colorSpace),ee=a.convert(F.type),he=A(F.internalFormat,ve,ee,F.colorSpace),me=Ze(f);U&&pe(f)===!1?e.renderbufferStorageMultisample(e.RENDERBUFFER,me,he,f.width,f.height):pe(f)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,me,he,f.width,f.height):e.renderbufferStorage(e.RENDERBUFFER,he,f.width,f.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ee(v,f){if(f&&f.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(e.FRAMEBUFFER,v),!(f.depthTexture&&f.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const H=i.get(f.depthTexture);H.__renderTarget=f,(!H.__webglTexture||f.depthTexture.image.width!==f.width||f.depthTexture.image.height!==f.height)&&(f.depthTexture.image.width=f.width,f.depthTexture.image.height=f.height,f.depthTexture.needsUpdate=!0),$(f.depthTexture,0);const Y=H.__webglTexture,F=Ze(f);if(f.depthTexture.format===li)pe(f)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,Y,0,F):e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,Y,0);else if(f.depthTexture.format===xn)pe(f)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,Y,0,F):e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,Y,0);else throw new Error("Unknown depthTexture format")}function Oe(v){const f=i.get(v),U=v.isWebGLCubeRenderTarget===!0;if(f.__boundDepthTexture!==v.depthTexture){const H=v.depthTexture;if(f.__depthDisposeCallback&&f.__depthDisposeCallback(),H){const Y=()=>{delete f.__boundDepthTexture,delete f.__depthDisposeCallback,H.removeEventListener("dispose",Y)};H.addEventListener("dispose",Y),f.__depthDisposeCallback=Y}f.__boundDepthTexture=H}if(v.depthTexture&&!f.__autoAllocateDepthBuffer){if(U)throw new Error("target.depthTexture not supported in Cube render targets");const H=v.texture.mipmaps;H&&H.length>0?Ee(f.__webglFramebuffer[0],v):Ee(f.__webglFramebuffer,v)}else if(U){f.__webglDepthbuffer=[];for(let H=0;H<6;H++)if(t.bindFramebuffer(e.FRAMEBUFFER,f.__webglFramebuffer[H]),f.__webglDepthbuffer[H]===void 0)f.__webglDepthbuffer[H]=e.createRenderbuffer(),be(f.__webglDepthbuffer[H],v,!1);else{const Y=v.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,F=f.__webglDepthbuffer[H];e.bindRenderbuffer(e.RENDERBUFFER,F),e.framebufferRenderbuffer(e.FRAMEBUFFER,Y,e.RENDERBUFFER,F)}}else{const H=v.texture.mipmaps;if(H&&H.length>0?t.bindFramebuffer(e.FRAMEBUFFER,f.__webglFramebuffer[0]):t.bindFramebuffer(e.FRAMEBUFFER,f.__webglFramebuffer),f.__webglDepthbuffer===void 0)f.__webglDepthbuffer=e.createRenderbuffer(),be(f.__webglDepthbuffer,v,!1);else{const Y=v.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,F=f.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,F),e.framebufferRenderbuffer(e.FRAMEBUFFER,Y,e.RENDERBUFFER,F)}}t.bindFramebuffer(e.FRAMEBUFFER,null)}function st(v,f,U){const H=i.get(v);f!==void 0&&le(H.__webglFramebuffer,v,v.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),U!==void 0&&Oe(v)}function T(v){const f=v.texture,U=i.get(v),H=i.get(f);v.addEventListener("dispose",I);const Y=v.textures,F=v.isWebGLCubeRenderTarget===!0,ve=Y.length>1;if(ve||(H.__webglTexture===void 0&&(H.__webglTexture=e.createTexture()),H.__version=f.version,o.memory.textures++),F){U.__webglFramebuffer=[];for(let ee=0;ee<6;ee++)if(f.mipmaps&&f.mipmaps.length>0){U.__webglFramebuffer[ee]=[];for(let he=0;he<f.mipmaps.length;he++)U.__webglFramebuffer[ee][he]=e.createFramebuffer()}else U.__webglFramebuffer[ee]=e.createFramebuffer()}else{if(f.mipmaps&&f.mipmaps.length>0){U.__webglFramebuffer=[];for(let ee=0;ee<f.mipmaps.length;ee++)U.__webglFramebuffer[ee]=e.createFramebuffer()}else U.__webglFramebuffer=e.createFramebuffer();if(ve)for(let ee=0,he=Y.length;ee<he;ee++){const me=i.get(Y[ee]);me.__webglTexture===void 0&&(me.__webglTexture=e.createTexture(),o.memory.textures++)}if(v.samples>0&&pe(v)===!1){U.__webglMultisampledFramebuffer=e.createFramebuffer(),U.__webglColorRenderbuffer=[],t.bindFramebuffer(e.FRAMEBUFFER,U.__webglMultisampledFramebuffer);for(let ee=0;ee<Y.length;ee++){const he=Y[ee];U.__webglColorRenderbuffer[ee]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,U.__webglColorRenderbuffer[ee]);const me=a.convert(he.format,he.colorSpace),Q=a.convert(he.type),oe=A(he.internalFormat,me,Q,he.colorSpace,v.isXRRenderTarget===!0),Ae=Ze(v);e.renderbufferStorageMultisample(e.RENDERBUFFER,Ae,oe,v.width,v.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ee,e.RENDERBUFFER,U.__webglColorRenderbuffer[ee])}e.bindRenderbuffer(e.RENDERBUFFER,null),v.depthBuffer&&(U.__webglDepthRenderbuffer=e.createRenderbuffer(),be(U.__webglDepthRenderbuffer,v,!0)),t.bindFramebuffer(e.FRAMEBUFFER,null)}}if(F){t.bindTexture(e.TEXTURE_CUBE_MAP,H.__webglTexture),Ve(e.TEXTURE_CUBE_MAP,f);for(let ee=0;ee<6;ee++)if(f.mipmaps&&f.mipmaps.length>0)for(let he=0;he<f.mipmaps.length;he++)le(U.__webglFramebuffer[ee][he],v,f,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,he);else le(U.__webglFramebuffer[ee],v,f,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0);d(f)&&c(e.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ve){for(let ee=0,he=Y.length;ee<he;ee++){const me=Y[ee],Q=i.get(me);let oe=e.TEXTURE_2D;(v.isWebGL3DRenderTarget||v.isWebGLArrayRenderTarget)&&(oe=v.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(oe,Q.__webglTexture),Ve(oe,me),le(U.__webglFramebuffer,v,me,e.COLOR_ATTACHMENT0+ee,oe,0),d(me)&&c(oe)}t.unbindTexture()}else{let ee=e.TEXTURE_2D;if((v.isWebGL3DRenderTarget||v.isWebGLArrayRenderTarget)&&(ee=v.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(ee,H.__webglTexture),Ve(ee,f),f.mipmaps&&f.mipmaps.length>0)for(let he=0;he<f.mipmaps.length;he++)le(U.__webglFramebuffer[he],v,f,e.COLOR_ATTACHMENT0,ee,he);else le(U.__webglFramebuffer,v,f,e.COLOR_ATTACHMENT0,ee,0);d(f)&&c(ee),t.unbindTexture()}v.depthBuffer&&Oe(v)}function $e(v){const f=v.textures;for(let U=0,H=f.length;U<H;U++){const Y=f[U];if(d(Y)){const F=w(v),ve=i.get(Y).__webglTexture;t.bindTexture(F,ve),c(F),t.unbindTexture()}}}const Pe=[],Re=[];function de(v){if(v.samples>0){if(pe(v)===!1){const f=v.textures,U=v.width,H=v.height;let Y=e.COLOR_BUFFER_BIT;const F=v.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ve=i.get(v),ee=f.length>1;if(ee)for(let me=0;me<f.length;me++)t.bindFramebuffer(e.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+me,e.RENDERBUFFER,null),t.bindFramebuffer(e.FRAMEBUFFER,ve.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+me,e.TEXTURE_2D,null,0);t.bindFramebuffer(e.READ_FRAMEBUFFER,ve.__webglMultisampledFramebuffer);const he=v.texture.mipmaps;he&&he.length>0?t.bindFramebuffer(e.DRAW_FRAMEBUFFER,ve.__webglFramebuffer[0]):t.bindFramebuffer(e.DRAW_FRAMEBUFFER,ve.__webglFramebuffer);for(let me=0;me<f.length;me++){if(v.resolveDepthBuffer&&(v.depthBuffer&&(Y|=e.DEPTH_BUFFER_BIT),v.stencilBuffer&&v.resolveStencilBuffer&&(Y|=e.STENCIL_BUFFER_BIT)),ee){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,ve.__webglColorRenderbuffer[me]);const Q=i.get(f[me]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,Q,0)}e.blitFramebuffer(0,0,U,H,0,0,U,H,Y,e.NEAREST),l===!0&&(Pe.length=0,Re.length=0,Pe.push(e.COLOR_ATTACHMENT0+me),v.depthBuffer&&v.resolveDepthBuffer===!1&&(Pe.push(F),Re.push(F),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,Re)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Pe))}if(t.bindFramebuffer(e.READ_FRAMEBUFFER,null),t.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),ee)for(let me=0;me<f.length;me++){t.bindFramebuffer(e.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+me,e.RENDERBUFFER,ve.__webglColorRenderbuffer[me]);const Q=i.get(f[me]).__webglTexture;t.bindFramebuffer(e.FRAMEBUFFER,ve.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+me,e.TEXTURE_2D,Q,0)}t.bindFramebuffer(e.DRAW_FRAMEBUFFER,ve.__webglMultisampledFramebuffer)}else if(v.depthBuffer&&v.resolveDepthBuffer===!1&&l){const f=v.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[f])}}}function Ze(v){return Math.min(r.maxSamples,v.samples)}function pe(v){const f=i.get(v);return v.samples>0&&n.has("WEBGL_multisampled_render_to_texture")===!0&&f.__useRenderToTexture!==!1}function Ue(v){const f=o.render.frame;m.get(v)!==f&&(m.set(v,f),v.update())}function ot(v,f){const U=v.colorSpace,H=v.format,Y=v.type;return v.isCompressedTexture===!0||v.isVideoTexture===!0||U!==mt&&U!==$t&&(tt.getTransfer(U)===qe?(H!==bt||Y!==Xt)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",U)),f}function it(v){return typeof HTMLImageElement<"u"&&v instanceof HTMLImageElement?(u.width=v.naturalWidth||v.width,u.height=v.naturalHeight||v.height):typeof VideoFrame<"u"&&v instanceof VideoFrame?(u.width=v.displayWidth,u.height=v.displayHeight):(u.width=v.width,u.height=v.height),u}this.allocateTextureUnit=X,this.resetTextureUnits=B,this.setTexture2D=$,this.setTexture2DArray=W,this.setTexture3D=ne,this.setTextureCube=G,this.rebindTextures=st,this.setupRenderTarget=T,this.updateRenderTargetMipmap=$e,this.updateMultisampleRenderTarget=de,this.setupDepthRenderbuffer=Oe,this.setupFrameBufferTexture=le,this.useMultisampledRTT=pe}function yu(e,n){function t(i,r=$t){let a;const o=tt.getTransfer(r);if(i===Xt)return e.UNSIGNED_BYTE;if(i===Hr)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Gr)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Qa)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===Ja)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===eo)return e.BYTE;if(i===to)return e.SHORT;if(i===Cn)return e.UNSIGNED_SHORT;if(i===zr)return e.INT;if(i===pn)return e.UNSIGNED_INT;if(i===Vt)return e.FLOAT;if(i===bn)return e.HALF_FLOAT;if(i===no)return e.ALPHA;if(i===io)return e.RGB;if(i===bt)return e.RGBA;if(i===li)return e.DEPTH_COMPONENT;if(i===xn)return e.DEPTH_STENCIL;if(i===ro)return e.RED;if(i===Wr)return e.RED_INTEGER;if(i===ao)return e.RG;if(i===Xr)return e.RG_INTEGER;if(i===Kr)return e.RGBA_INTEGER;if(i===In||i===Nn||i===yn||i===On)if(o===qe)if(a=n.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===In)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Nn)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===yn)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===On)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=n.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===In)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Nn)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===yn)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===On)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Ei||i===Si||i===Ti||i===Mi)if(a=n.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===Ei)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Si)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Ti)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Mi)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===xi||i===Ai||i===Ri)if(a=n.get("WEBGL_compressed_texture_etc"),a!==null){if(i===xi||i===Ai)return o===qe?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===Ri)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Ci||i===bi||i===Li||i===Pi||i===wi||i===Di||i===Ui||i===Ii||i===Ni||i===yi||i===Oi||i===Fi||i===Bi||i===Hi)if(a=n.get("WEBGL_compressed_texture_astc"),a!==null){if(i===Ci)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===bi)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Li)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Pi)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===wi)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Di)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Ui)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Ii)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Ni)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===yi)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Oi)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Fi)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Bi)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Hi)return o===qe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Gi||i===Vi||i===ki)if(a=n.get("EXT_texture_compression_bptc"),a!==null){if(i===Gi)return o===qe?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Vi)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===ki)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===zi||i===Wi||i===Xi||i===Ki)if(a=n.get("EXT_texture_compression_rgtc"),a!==null){if(i===zi)return a.COMPRESSED_RED_RGTC1_EXT;if(i===Wi)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Xi)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Ki)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===dn?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:t}}const Ou=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Fu=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Bu{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(n,t){if(this.texture===null){const i=new Vr(n.texture);(n.depthNear!==t.depthNear||n.depthFar!==t.depthFar)&&(this.depthNear=n.depthNear,this.depthFar=n.depthFar),this.texture=i}}getMesh(n){if(this.texture!==null&&this.mesh===null){const t=n.cameras[0].viewport,i=new Kt({vertexShader:Ou,fragmentShader:Fu,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Pt(new kr(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Hu extends Ta{constructor(n,t){super();const i=this;let r=null,a=1,o=null,s="local-floor",l=1,u=null,m=null,h=null,_=null,S=null,D=null;const C=typeof XRWebGLBinding<"u",d=new Bu,c={},w=t.getContextAttributes();let A=null,M=null;const N=[],L=[],I=new ct;let V=null;const E=new fn;E.viewport=new dt;const g=new fn;g.viewport=new dt;const P=[E,g],B=new Ma;let X=null,K=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(k){let q=N[k];return q===void 0&&(q=new Un,N[k]=q),q.getTargetRaySpace()},this.getControllerGrip=function(k){let q=N[k];return q===void 0&&(q=new Un,N[k]=q),q.getGripSpace()},this.getHand=function(k){let q=N[k];return q===void 0&&(q=new Un,N[k]=q),q.getHandSpace()};function $(k){const q=L.indexOf(k.inputSource);if(q===-1)return;const le=N[q];le!==void 0&&(le.update(k.inputSource,k.frame,u||o),le.dispatchEvent({type:k.type,data:k.inputSource}))}function W(){r.removeEventListener("select",$),r.removeEventListener("selectstart",$),r.removeEventListener("selectend",$),r.removeEventListener("squeeze",$),r.removeEventListener("squeezestart",$),r.removeEventListener("squeezeend",$),r.removeEventListener("end",W),r.removeEventListener("inputsourceschange",ne);for(let k=0;k<N.length;k++){const q=L[k];q!==null&&(L[k]=null,N[k].disconnect(q))}X=null,K=null,d.reset();for(const k in c)delete c[k];n.setRenderTarget(A),S=null,_=null,h=null,r=null,M=null,We.stop(),i.isPresenting=!1,n.setPixelRatio(V),n.setSize(I.width,I.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(k){a=k,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(k){s=k,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return u||o},this.setReferenceSpace=function(k){u=k},this.getBaseLayer=function(){return _!==null?_:S},this.getBinding=function(){return h===null&&C&&(h=new XRWebGLBinding(r,t)),h},this.getFrame=function(){return D},this.getSession=function(){return r},this.setSession=async function(k){if(r=k,r!==null){if(A=n.getRenderTarget(),r.addEventListener("select",$),r.addEventListener("selectstart",$),r.addEventListener("selectend",$),r.addEventListener("squeeze",$),r.addEventListener("squeezestart",$),r.addEventListener("squeezeend",$),r.addEventListener("end",W),r.addEventListener("inputsourceschange",ne),w.xrCompatible!==!0&&await t.makeXRCompatible(),V=n.getPixelRatio(),n.getSize(I),C&&"createProjectionLayer"in XRWebGLBinding.prototype){let le=null,be=null,Ee=null;w.depth&&(Ee=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,le=w.stencil?xn:li,be=w.stencil?dn:pn);const Oe={colorFormat:t.RGBA8,depthFormat:Ee,scaleFactor:a};h=this.getBinding(),_=h.createProjectionLayer(Oe),r.updateRenderState({layers:[_]}),n.setPixelRatio(1),n.setSize(_.textureWidth,_.textureHeight,!1),M=new en(_.textureWidth,_.textureHeight,{format:bt,type:Xt,depthTexture:new Ir(_.textureWidth,_.textureHeight,be,void 0,void 0,void 0,void 0,void 0,void 0,le),stencilBuffer:w.stencil,colorSpace:n.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:_.ignoreDepthValues===!1,resolveStencilBuffer:_.ignoreDepthValues===!1})}else{const le={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:a};S=new XRWebGLLayer(r,t,le),r.updateRenderState({baseLayer:S}),n.setPixelRatio(1),n.setSize(S.framebufferWidth,S.framebufferHeight,!1),M=new en(S.framebufferWidth,S.framebufferHeight,{format:bt,type:Xt,colorSpace:n.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:S.ignoreDepthValues===!1,resolveStencilBuffer:S.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),u=null,o=await r.requestReferenceSpace(s),We.setContext(r),We.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return d.getDepthTexture()};function ne(k){for(let q=0;q<k.removed.length;q++){const le=k.removed[q],be=L.indexOf(le);be>=0&&(L[be]=null,N[be].disconnect(le))}for(let q=0;q<k.added.length;q++){const le=k.added[q];let be=L.indexOf(le);if(be===-1){for(let Oe=0;Oe<N.length;Oe++)if(Oe>=L.length){L.push(le),be=Oe;break}else if(L[Oe]===null){L[Oe]=le,be=Oe;break}if(be===-1)break}const Ee=N[be];Ee&&Ee.connect(le)}}const G=new Fe,ge=new Fe;function Me(k,q,le){G.setFromMatrixPosition(q.matrixWorld),ge.setFromMatrixPosition(le.matrixWorld);const be=G.distanceTo(ge),Ee=q.projectionMatrix.elements,Oe=le.projectionMatrix.elements,st=Ee[14]/(Ee[10]-1),T=Ee[14]/(Ee[10]+1),$e=(Ee[9]+1)/Ee[5],Pe=(Ee[9]-1)/Ee[5],Re=(Ee[8]-1)/Ee[0],de=(Oe[8]+1)/Oe[0],Ze=st*Re,pe=st*de,Ue=be/(-Re+de),ot=Ue*-Re;if(q.matrixWorld.decompose(k.position,k.quaternion,k.scale),k.translateX(ot),k.translateZ(Ue),k.matrixWorld.compose(k.position,k.quaternion,k.scale),k.matrixWorldInverse.copy(k.matrixWorld).invert(),Ee[10]===-1)k.projectionMatrix.copy(q.projectionMatrix),k.projectionMatrixInverse.copy(q.projectionMatrixInverse);else{const it=st+Ue,v=T+Ue,f=Ze-ot,U=pe+(be-ot),H=$e*T/v*it,Y=Pe*T/v*it;k.projectionMatrix.makePerspective(f,U,H,Y,it,v),k.projectionMatrixInverse.copy(k.projectionMatrix).invert()}}function De(k,q){q===null?k.matrixWorld.copy(k.matrix):k.matrixWorld.multiplyMatrices(q.matrixWorld,k.matrix),k.matrixWorldInverse.copy(k.matrixWorld).invert()}this.updateCamera=function(k){if(r===null)return;let q=k.near,le=k.far;d.texture!==null&&(d.depthNear>0&&(q=d.depthNear),d.depthFar>0&&(le=d.depthFar)),B.near=g.near=E.near=q,B.far=g.far=E.far=le,(X!==B.near||K!==B.far)&&(r.updateRenderState({depthNear:B.near,depthFar:B.far}),X=B.near,K=B.far),B.layers.mask=k.layers.mask|6,E.layers.mask=B.layers.mask&3,g.layers.mask=B.layers.mask&5;const be=k.parent,Ee=B.cameras;De(B,be);for(let Oe=0;Oe<Ee.length;Oe++)De(Ee[Oe],be);Ee.length===2?Me(B,E,g):B.projectionMatrix.copy(E.projectionMatrix),Ve(k,B,be)};function Ve(k,q,le){le===null?k.matrix.copy(q.matrixWorld):(k.matrix.copy(le.matrixWorld),k.matrix.invert(),k.matrix.multiply(q.matrixWorld)),k.matrix.decompose(k.position,k.quaternion,k.scale),k.updateMatrixWorld(!0),k.projectionMatrix.copy(q.projectionMatrix),k.projectionMatrixInverse.copy(q.projectionMatrixInverse),k.isPerspectiveCamera&&(k.fov=xa*2*Math.atan(1/k.projectionMatrix.elements[5]),k.zoom=1)}this.getCamera=function(){return B},this.getFoveation=function(){if(!(_===null&&S===null))return l},this.setFoveation=function(k){l=k,_!==null&&(_.fixedFoveation=k),S!==null&&S.fixedFoveation!==void 0&&(S.fixedFoveation=k)},this.hasDepthSensing=function(){return d.texture!==null},this.getDepthSensingMesh=function(){return d.getMesh(B)},this.getCameraTexture=function(k){return c[k]};let nt=null;function Je(k,q){if(m=q.getViewerPose(u||o),D=q,m!==null){const le=m.views;S!==null&&(n.setRenderTargetFramebuffer(M,S.framebuffer),n.setRenderTarget(M));let be=!1;le.length!==B.cameras.length&&(B.cameras.length=0,be=!0);for(let T=0;T<le.length;T++){const $e=le[T];let Pe=null;if(S!==null)Pe=S.getViewport($e);else{const de=h.getViewSubImage(_,$e);Pe=de.viewport,T===0&&(n.setRenderTargetTextures(M,de.colorTexture,de.depthStencilTexture),n.setRenderTarget(M))}let Re=P[T];Re===void 0&&(Re=new fn,Re.layers.enable(T),Re.viewport=new dt,P[T]=Re),Re.matrix.fromArray($e.transform.matrix),Re.matrix.decompose(Re.position,Re.quaternion,Re.scale),Re.projectionMatrix.fromArray($e.projectionMatrix),Re.projectionMatrixInverse.copy(Re.projectionMatrix).invert(),Re.viewport.set(Pe.x,Pe.y,Pe.width,Pe.height),T===0&&(B.matrix.copy(Re.matrix),B.matrix.decompose(B.position,B.quaternion,B.scale)),be===!0&&B.cameras.push(Re)}const Ee=r.enabledFeatures;if(Ee&&Ee.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&C){h=i.getBinding();const T=h.getDepthInformation(le[0]);T&&T.isValid&&T.texture&&d.init(T,r.renderState)}if(Ee&&Ee.includes("camera-access")&&C){n.state.unbindTexture(),h=i.getBinding();for(let T=0;T<le.length;T++){const $e=le[T].camera;if($e){let Pe=c[$e];Pe||(Pe=new Vr,c[$e]=Pe);const Re=h.getCameraImage($e);Pe.sourceTexture=Re}}}}for(let le=0;le<N.length;le++){const be=L[le],Ee=N[le];be!==null&&Ee!==void 0&&Ee.update(be,q,u||o)}nt&&nt(k,q),q.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:q}),D=null}const We=new aa;We.setAnimationLoop(Je),this.setAnimationLoop=function(k){nt=k},this.dispose=function(){}}}const Ot=new Zr,Gu=new wt;function Vu(e,n){function t(d,c){d.matrixAutoUpdate===!0&&d.updateMatrix(),c.value.copy(d.matrix)}function i(d,c){c.color.getRGB(d.fogColor.value,qr(e)),c.isFog?(d.fogNear.value=c.near,d.fogFar.value=c.far):c.isFogExp2&&(d.fogDensity.value=c.density)}function r(d,c,w,A,M){c.isMeshBasicMaterial||c.isMeshLambertMaterial?a(d,c):c.isMeshToonMaterial?(a(d,c),h(d,c)):c.isMeshPhongMaterial?(a(d,c),m(d,c)):c.isMeshStandardMaterial?(a(d,c),_(d,c),c.isMeshPhysicalMaterial&&S(d,c,M)):c.isMeshMatcapMaterial?(a(d,c),D(d,c)):c.isMeshDepthMaterial?a(d,c):c.isMeshDistanceMaterial?(a(d,c),C(d,c)):c.isMeshNormalMaterial?a(d,c):c.isLineBasicMaterial?(o(d,c),c.isLineDashedMaterial&&s(d,c)):c.isPointsMaterial?l(d,c,w,A):c.isSpriteMaterial?u(d,c):c.isShadowMaterial?(d.color.value.copy(c.color),d.opacity.value=c.opacity):c.isShaderMaterial&&(c.uniformsNeedUpdate=!1)}function a(d,c){d.opacity.value=c.opacity,c.color&&d.diffuse.value.copy(c.color),c.emissive&&d.emissive.value.copy(c.emissive).multiplyScalar(c.emissiveIntensity),c.map&&(d.map.value=c.map,t(c.map,d.mapTransform)),c.alphaMap&&(d.alphaMap.value=c.alphaMap,t(c.alphaMap,d.alphaMapTransform)),c.bumpMap&&(d.bumpMap.value=c.bumpMap,t(c.bumpMap,d.bumpMapTransform),d.bumpScale.value=c.bumpScale,c.side===Et&&(d.bumpScale.value*=-1)),c.normalMap&&(d.normalMap.value=c.normalMap,t(c.normalMap,d.normalMapTransform),d.normalScale.value.copy(c.normalScale),c.side===Et&&d.normalScale.value.negate()),c.displacementMap&&(d.displacementMap.value=c.displacementMap,t(c.displacementMap,d.displacementMapTransform),d.displacementScale.value=c.displacementScale,d.displacementBias.value=c.displacementBias),c.emissiveMap&&(d.emissiveMap.value=c.emissiveMap,t(c.emissiveMap,d.emissiveMapTransform)),c.specularMap&&(d.specularMap.value=c.specularMap,t(c.specularMap,d.specularMapTransform)),c.alphaTest>0&&(d.alphaTest.value=c.alphaTest);const w=n.get(c),A=w.envMap,M=w.envMapRotation;A&&(d.envMap.value=A,Ot.copy(M),Ot.x*=-1,Ot.y*=-1,Ot.z*=-1,A.isCubeTexture&&A.isRenderTargetTexture===!1&&(Ot.y*=-1,Ot.z*=-1),d.envMapRotation.value.setFromMatrix4(Gu.makeRotationFromEuler(Ot)),d.flipEnvMap.value=A.isCubeTexture&&A.isRenderTargetTexture===!1?-1:1,d.reflectivity.value=c.reflectivity,d.ior.value=c.ior,d.refractionRatio.value=c.refractionRatio),c.lightMap&&(d.lightMap.value=c.lightMap,d.lightMapIntensity.value=c.lightMapIntensity,t(c.lightMap,d.lightMapTransform)),c.aoMap&&(d.aoMap.value=c.aoMap,d.aoMapIntensity.value=c.aoMapIntensity,t(c.aoMap,d.aoMapTransform))}function o(d,c){d.diffuse.value.copy(c.color),d.opacity.value=c.opacity,c.map&&(d.map.value=c.map,t(c.map,d.mapTransform))}function s(d,c){d.dashSize.value=c.dashSize,d.totalSize.value=c.dashSize+c.gapSize,d.scale.value=c.scale}function l(d,c,w,A){d.diffuse.value.copy(c.color),d.opacity.value=c.opacity,d.size.value=c.size*w,d.scale.value=A*.5,c.map&&(d.map.value=c.map,t(c.map,d.uvTransform)),c.alphaMap&&(d.alphaMap.value=c.alphaMap,t(c.alphaMap,d.alphaMapTransform)),c.alphaTest>0&&(d.alphaTest.value=c.alphaTest)}function u(d,c){d.diffuse.value.copy(c.color),d.opacity.value=c.opacity,d.rotation.value=c.rotation,c.map&&(d.map.value=c.map,t(c.map,d.mapTransform)),c.alphaMap&&(d.alphaMap.value=c.alphaMap,t(c.alphaMap,d.alphaMapTransform)),c.alphaTest>0&&(d.alphaTest.value=c.alphaTest)}function m(d,c){d.specular.value.copy(c.specular),d.shininess.value=Math.max(c.shininess,1e-4)}function h(d,c){c.gradientMap&&(d.gradientMap.value=c.gradientMap)}function _(d,c){d.metalness.value=c.metalness,c.metalnessMap&&(d.metalnessMap.value=c.metalnessMap,t(c.metalnessMap,d.metalnessMapTransform)),d.roughness.value=c.roughness,c.roughnessMap&&(d.roughnessMap.value=c.roughnessMap,t(c.roughnessMap,d.roughnessMapTransform)),c.envMap&&(d.envMapIntensity.value=c.envMapIntensity)}function S(d,c,w){d.ior.value=c.ior,c.sheen>0&&(d.sheenColor.value.copy(c.sheenColor).multiplyScalar(c.sheen),d.sheenRoughness.value=c.sheenRoughness,c.sheenColorMap&&(d.sheenColorMap.value=c.sheenColorMap,t(c.sheenColorMap,d.sheenColorMapTransform)),c.sheenRoughnessMap&&(d.sheenRoughnessMap.value=c.sheenRoughnessMap,t(c.sheenRoughnessMap,d.sheenRoughnessMapTransform))),c.clearcoat>0&&(d.clearcoat.value=c.clearcoat,d.clearcoatRoughness.value=c.clearcoatRoughness,c.clearcoatMap&&(d.clearcoatMap.value=c.clearcoatMap,t(c.clearcoatMap,d.clearcoatMapTransform)),c.clearcoatRoughnessMap&&(d.clearcoatRoughnessMap.value=c.clearcoatRoughnessMap,t(c.clearcoatRoughnessMap,d.clearcoatRoughnessMapTransform)),c.clearcoatNormalMap&&(d.clearcoatNormalMap.value=c.clearcoatNormalMap,t(c.clearcoatNormalMap,d.clearcoatNormalMapTransform),d.clearcoatNormalScale.value.copy(c.clearcoatNormalScale),c.side===Et&&d.clearcoatNormalScale.value.negate())),c.dispersion>0&&(d.dispersion.value=c.dispersion),c.iridescence>0&&(d.iridescence.value=c.iridescence,d.iridescenceIOR.value=c.iridescenceIOR,d.iridescenceThicknessMinimum.value=c.iridescenceThicknessRange[0],d.iridescenceThicknessMaximum.value=c.iridescenceThicknessRange[1],c.iridescenceMap&&(d.iridescenceMap.value=c.iridescenceMap,t(c.iridescenceMap,d.iridescenceMapTransform)),c.iridescenceThicknessMap&&(d.iridescenceThicknessMap.value=c.iridescenceThicknessMap,t(c.iridescenceThicknessMap,d.iridescenceThicknessMapTransform))),c.transmission>0&&(d.transmission.value=c.transmission,d.transmissionSamplerMap.value=w.texture,d.transmissionSamplerSize.value.set(w.width,w.height),c.transmissionMap&&(d.transmissionMap.value=c.transmissionMap,t(c.transmissionMap,d.transmissionMapTransform)),d.thickness.value=c.thickness,c.thicknessMap&&(d.thicknessMap.value=c.thicknessMap,t(c.thicknessMap,d.thicknessMapTransform)),d.attenuationDistance.value=c.attenuationDistance,d.attenuationColor.value.copy(c.attenuationColor)),c.anisotropy>0&&(d.anisotropyVector.value.set(c.anisotropy*Math.cos(c.anisotropyRotation),c.anisotropy*Math.sin(c.anisotropyRotation)),c.anisotropyMap&&(d.anisotropyMap.value=c.anisotropyMap,t(c.anisotropyMap,d.anisotropyMapTransform))),d.specularIntensity.value=c.specularIntensity,d.specularColor.value.copy(c.specularColor),c.specularColorMap&&(d.specularColorMap.value=c.specularColorMap,t(c.specularColorMap,d.specularColorMapTransform)),c.specularIntensityMap&&(d.specularIntensityMap.value=c.specularIntensityMap,t(c.specularIntensityMap,d.specularIntensityMapTransform))}function D(d,c){c.matcap&&(d.matcap.value=c.matcap)}function C(d,c){const w=n.get(c).light;d.referencePosition.value.setFromMatrixPosition(w.matrixWorld),d.nearDistance.value=w.shadow.camera.near,d.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function ku(e,n,t,i){let r={},a={},o=[];const s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function l(w,A){const M=A.program;i.uniformBlockBinding(w,M)}function u(w,A){let M=r[w.id];M===void 0&&(D(w),M=m(w),r[w.id]=M,w.addEventListener("dispose",d));const N=A.program;i.updateUBOMapping(w,N);const L=n.render.frame;a[w.id]!==L&&(_(w),a[w.id]=L)}function m(w){const A=h();w.__bindingPointIndex=A;const M=e.createBuffer(),N=w.__size,L=w.usage;return e.bindBuffer(e.UNIFORM_BUFFER,M),e.bufferData(e.UNIFORM_BUFFER,N,L),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,A,M),M}function h(){for(let w=0;w<s;w++)if(o.indexOf(w)===-1)return o.push(w),w;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function _(w){const A=r[w.id],M=w.uniforms,N=w.__cache;e.bindBuffer(e.UNIFORM_BUFFER,A);for(let L=0,I=M.length;L<I;L++){const V=Array.isArray(M[L])?M[L]:[M[L]];for(let E=0,g=V.length;E<g;E++){const P=V[E];if(S(P,L,E,N)===!0){const B=P.__offset,X=Array.isArray(P.value)?P.value:[P.value];let K=0;for(let $=0;$<X.length;$++){const W=X[$],ne=C(W);typeof W=="number"||typeof W=="boolean"?(P.__data[0]=W,e.bufferSubData(e.UNIFORM_BUFFER,B+K,P.__data)):W.isMatrix3?(P.__data[0]=W.elements[0],P.__data[1]=W.elements[1],P.__data[2]=W.elements[2],P.__data[3]=0,P.__data[4]=W.elements[3],P.__data[5]=W.elements[4],P.__data[6]=W.elements[5],P.__data[7]=0,P.__data[8]=W.elements[6],P.__data[9]=W.elements[7],P.__data[10]=W.elements[8],P.__data[11]=0):(W.toArray(P.__data,K),K+=ne.storage/Float32Array.BYTES_PER_ELEMENT)}e.bufferSubData(e.UNIFORM_BUFFER,B,P.__data)}}}e.bindBuffer(e.UNIFORM_BUFFER,null)}function S(w,A,M,N){const L=w.value,I=A+"_"+M;if(N[I]===void 0)return typeof L=="number"||typeof L=="boolean"?N[I]=L:N[I]=L.clone(),!0;{const V=N[I];if(typeof L=="number"||typeof L=="boolean"){if(V!==L)return N[I]=L,!0}else if(V.equals(L)===!1)return V.copy(L),!0}return!1}function D(w){const A=w.uniforms;let M=0;const N=16;for(let I=0,V=A.length;I<V;I++){const E=Array.isArray(A[I])?A[I]:[A[I]];for(let g=0,P=E.length;g<P;g++){const B=E[g],X=Array.isArray(B.value)?B.value:[B.value];for(let K=0,$=X.length;K<$;K++){const W=X[K],ne=C(W),G=M%N,ge=G%ne.boundary,Me=G+ge;M+=ge,Me!==0&&N-Me<ne.storage&&(M+=N-Me),B.__data=new Float32Array(ne.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=M,M+=ne.storage}}}const L=M%N;return L>0&&(M+=N-L),w.__size=M,w.__cache={},this}function C(w){const A={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(A.boundary=4,A.storage=4):w.isVector2?(A.boundary=8,A.storage=8):w.isVector3||w.isColor?(A.boundary=16,A.storage=12):w.isVector4?(A.boundary=16,A.storage=16):w.isMatrix3?(A.boundary=48,A.storage=48):w.isMatrix4?(A.boundary=64,A.storage=64):w.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",w),A}function d(w){const A=w.target;A.removeEventListener("dispose",d);const M=o.indexOf(A.__bindingPointIndex);o.splice(M,1),e.deleteBuffer(r[A.id]),delete r[A.id],delete a[A.id]}function c(){for(const w in r)e.deleteBuffer(r[w]);o=[],r={},a={}}return{bind:l,update:u,dispose:c}}class Ad{constructor(n={}){const{canvas:t=va(),context:i=null,depth:r=!0,stencil:a=!1,alpha:o=!1,antialias:s=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:u=!1,powerPreference:m="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:_=!1}=n;this.isWebGLRenderer=!0;let S;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");S=i.getContextAttributes().alpha}else S=o;const D=new Uint32Array(4),C=new Int32Array(4);let d=null,c=null;const w=[],A=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ut,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const M=this;let N=!1;this._outputColorSpace=Jt;let L=0,I=0,V=null,E=-1,g=null;const P=new dt,B=new dt;let X=null;const K=new Ge(0);let $=0,W=t.width,ne=t.height,G=1,ge=null,Me=null;const De=new dt(0,0,W,ne),Ve=new dt(0,0,W,ne);let nt=!1;const Je=new Ur;let We=!1,k=!1;const q=new wt,le=new Fe,be=new dt,Ee={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Oe=!1;function st(){return V===null?G:1}let T=i;function $e(p,R){return t.getContext(p,R)}try{const p={alpha:!0,depth:r,stencil:a,antialias:s,premultipliedAlpha:l,preserveDrawingBuffer:u,powerPreference:m,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ea}`),t.addEventListener("webglcontextlost",te,!1),t.addEventListener("webglcontextrestored",ce,!1),t.addEventListener("webglcontextcreationerror",Z,!1),T===null){const R="webgl2";if(T=$e(R,p),T===null)throw $e(R)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(p){throw console.error("THREE.WebGLRenderer: "+p.message),p}let Pe,Re,de,Ze,pe,Ue,ot,it,v,f,U,H,Y,F,ve,ee,he,me,Q,oe,Ae,_e,re,we;function x(){Pe=new Ql(T),Pe.init(),_e=new yu(T,Pe),Re=new Xl(T,Pe,n,_e),de=new Iu(T,Pe),Re.reversedDepthBuffer&&_&&de.buffers.depth.setReversed(!0),Ze=new tf(T),pe=new Su,Ue=new Nu(T,Pe,de,pe,Re,_e,Ze),ot=new Yl(M),it=new jl(M),v=new ss(T),re=new zl(T,v),f=new Jl(T,v,Ze,re),U=new rf(T,f,v,Ze),Q=new nf(T,Re,Ue),ee=new Kl(pe),H=new Eu(M,ot,it,Pe,Re,re,ee),Y=new Vu(M,pe),F=new Mu,ve=new Lu(Pe),me=new kl(M,ot,it,de,U,S,l),he=new Du(M,U,Re),we=new ku(T,Ze,Re,de),oe=new Wl(T,Pe,Ze),Ae=new ef(T,Pe,Ze),Ze.programs=H.programs,M.capabilities=Re,M.extensions=Pe,M.properties=pe,M.renderLists=F,M.shadowMap=he,M.state=de,M.info=Ze}x();const J=new Hu(M,T);this.xr=J,this.getContext=function(){return T},this.getContextAttributes=function(){return T.getContextAttributes()},this.forceContextLoss=function(){const p=Pe.get("WEBGL_lose_context");p&&p.loseContext()},this.forceContextRestore=function(){const p=Pe.get("WEBGL_lose_context");p&&p.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(p){p!==void 0&&(G=p,this.setSize(W,ne,!1))},this.getSize=function(p){return p.set(W,ne)},this.setSize=function(p,R,y=!0){if(J.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}W=p,ne=R,t.width=Math.floor(p*G),t.height=Math.floor(R*G),y===!0&&(t.style.width=p+"px",t.style.height=R+"px"),this.setViewport(0,0,p,R)},this.getDrawingBufferSize=function(p){return p.set(W*G,ne*G).floor()},this.setDrawingBufferSize=function(p,R,y){W=p,ne=R,G=y,t.width=Math.floor(p*y),t.height=Math.floor(R*y),this.setViewport(0,0,p,R)},this.getCurrentViewport=function(p){return p.copy(P)},this.getViewport=function(p){return p.copy(De)},this.setViewport=function(p,R,y,O){p.isVector4?De.set(p.x,p.y,p.z,p.w):De.set(p,R,y,O),de.viewport(P.copy(De).multiplyScalar(G).round())},this.getScissor=function(p){return p.copy(Ve)},this.setScissor=function(p,R,y,O){p.isVector4?Ve.set(p.x,p.y,p.z,p.w):Ve.set(p,R,y,O),de.scissor(B.copy(Ve).multiplyScalar(G).round())},this.getScissorTest=function(){return nt},this.setScissorTest=function(p){de.setScissorTest(nt=p)},this.setOpaqueSort=function(p){ge=p},this.setTransparentSort=function(p){Me=p},this.getClearColor=function(p){return p.copy(me.getClearColor())},this.setClearColor=function(){me.setClearColor(...arguments)},this.getClearAlpha=function(){return me.getClearAlpha()},this.setClearAlpha=function(){me.setClearAlpha(...arguments)},this.clear=function(p=!0,R=!0,y=!0){let O=0;if(p){let b=!1;if(V!==null){const j=V.texture.format;b=j===Kr||j===Xr||j===Wr}if(b){const j=V.texture.type,ae=j===Xt||j===pn||j===Cn||j===dn||j===Hr||j===Gr,fe=me.getClearColor(),se=me.getClearAlpha(),xe=fe.r,Ce=fe.g,Se=fe.b;ae?(D[0]=xe,D[1]=Ce,D[2]=Se,D[3]=se,T.clearBufferuiv(T.COLOR,0,D)):(C[0]=xe,C[1]=Ce,C[2]=Se,C[3]=se,T.clearBufferiv(T.COLOR,0,C))}else O|=T.COLOR_BUFFER_BIT}R&&(O|=T.DEPTH_BUFFER_BIT),y&&(O|=T.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),T.clear(O)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",te,!1),t.removeEventListener("webglcontextrestored",ce,!1),t.removeEventListener("webglcontextcreationerror",Z,!1),me.dispose(),F.dispose(),ve.dispose(),pe.dispose(),ot.dispose(),it.dispose(),U.dispose(),re.dispose(),we.dispose(),H.dispose(),J.dispose(),J.removeEventListener("sessionstart",St),J.removeEventListener("sessionend",di),It.stop()};function te(p){p.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),N=!0}function ce(){console.log("THREE.WebGLRenderer: Context Restored."),N=!1;const p=Ze.autoReset,R=he.enabled,y=he.autoUpdate,O=he.needsUpdate,b=he.type;x(),Ze.autoReset=p,he.enabled=R,he.autoUpdate=y,he.needsUpdate=O,he.type=b}function Z(p){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",p.statusMessage)}function z(p){const R=p.target;R.removeEventListener("dispose",z),ue(R)}function ue(p){Le(p),pe.remove(p)}function Le(p){const R=pe.get(p).programs;R!==void 0&&(R.forEach(function(y){H.releaseProgram(y)}),p.isShaderMaterial&&H.releaseShaderCache(p))}this.renderBufferDirect=function(p,R,y,O,b,j){R===null&&(R=Ee);const ae=b.isMesh&&b.matrixWorld.determinant()<0,fe=da(p,R,y,O,b);de.setMaterial(O,ae);let se=y.index,xe=1;if(O.wireframe===!0){if(se=f.getWireframeAttribute(y),se===void 0)return;xe=2}const Ce=y.drawRange,Se=y.attributes.position;let ye=Ce.start*xe,ze=(Ce.start+Ce.count)*xe;j!==null&&(ye=Math.max(ye,j.start*xe),ze=Math.min(ze,(j.start+j.count)*xe)),se!==null?(ye=Math.max(ye,0),ze=Math.min(ze,se.count)):Se!=null&&(ye=Math.max(ye,0),ze=Math.min(ze,Se.count));const et=ze-ye;if(et<0||et===1/0)return;re.setup(b,O,fe,y,se);let Ye,Xe=oe;if(se!==null&&(Ye=v.get(se),Xe=Ae,Xe.setIndex(Ye)),b.isMesh)O.wireframe===!0?(de.setLineWidth(O.wireframeLinewidth*st()),Xe.setMode(T.LINES)):Xe.setMode(T.TRIANGLES);else if(b.isLine){let Te=O.linewidth;Te===void 0&&(Te=1),de.setLineWidth(Te*st()),b.isLineSegments?Xe.setMode(T.LINES):b.isLineLoop?Xe.setMode(T.LINE_LOOP):Xe.setMode(T.LINE_STRIP)}else b.isPoints?Xe.setMode(T.POINTS):b.isSprite&&Xe.setMode(T.TRIANGLES);if(b.isBatchedMesh)if(b._multiDrawInstances!==null)qn("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),Xe.renderMultiDrawInstances(b._multiDrawStarts,b._multiDrawCounts,b._multiDrawCount,b._multiDrawInstances);else if(Pe.get("WEBGL_multi_draw"))Xe.renderMultiDraw(b._multiDrawStarts,b._multiDrawCounts,b._multiDrawCount);else{const Te=b._multiDrawStarts,je=b._multiDrawCounts,Be=b._multiDrawCount,pt=se?v.get(se).bytesPerElement:1,Yt=pe.get(O).currentProgram.getUniforms();for(let ht=0;ht<Be;ht++)Yt.setValue(T,"_gl_DrawID",ht),Xe.render(Te[ht]/pt,je[ht])}else if(b.isInstancedMesh)Xe.renderInstances(ye,et,b.count);else if(y.isInstancedBufferGeometry){const Te=y._maxInstanceCount!==void 0?y._maxInstanceCount:1/0,je=Math.min(y.instanceCount,Te);Xe.renderInstances(ye,et,je)}else Xe.render(ye,et)};function Ke(p,R,y){p.transparent===!0&&p.side===xt&&p.forceSinglePass===!1?(p.side=Et,p.needsUpdate=!0,_n(p,R,y),p.side=tn,p.needsUpdate=!0,_n(p,R,y),p.side=xt):_n(p,R,y)}this.compile=function(p,R,y=null){y===null&&(y=p),c=ve.get(y),c.init(R),A.push(c),y.traverseVisible(function(b){b.isLight&&b.layers.test(R.layers)&&(c.pushLight(b),b.castShadow&&c.pushShadow(b))}),p!==y&&p.traverseVisible(function(b){b.isLight&&b.layers.test(R.layers)&&(c.pushLight(b),b.castShadow&&c.pushShadow(b))}),c.setupLights();const O=new Set;return p.traverse(function(b){if(!(b.isMesh||b.isPoints||b.isLine||b.isSprite))return;const j=b.material;if(j)if(Array.isArray(j))for(let ae=0;ae<j.length;ae++){const fe=j[ae];Ke(fe,y,b),O.add(fe)}else Ke(j,y,b),O.add(j)}),c=A.pop(),O},this.compileAsync=function(p,R,y=null){const O=this.compile(p,R,y);return new Promise(b=>{function j(){if(O.forEach(function(ae){pe.get(ae).currentProgram.isReady()&&O.delete(ae)}),O.size===0){b(p);return}setTimeout(j,10)}Pe.get("KHR_parallel_shader_compile")!==null?j():setTimeout(j,10)})};let ke=null;function Rt(p){ke&&ke(p)}function St(){It.stop()}function di(){It.start()}const It=new aa;It.setAnimationLoop(Rt),typeof self<"u"&&It.setContext(self),this.setAnimationLoop=function(p){ke=p,J.setAnimationLoop(p),p===null?It.stop():It.start()},J.addEventListener("sessionstart",St),J.addEventListener("sessionend",di),this.render=function(p,R){if(R!==void 0&&R.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(N===!0)return;if(p.matrixWorldAutoUpdate===!0&&p.updateMatrixWorld(),R.parent===null&&R.matrixWorldAutoUpdate===!0&&R.updateMatrixWorld(),J.enabled===!0&&J.isPresenting===!0&&(J.cameraAutoUpdate===!0&&J.updateCamera(R),R=J.getCamera()),p.isScene===!0&&p.onBeforeRender(M,p,R,V),c=ve.get(p,A.length),c.init(R),A.push(c),q.multiplyMatrices(R.projectionMatrix,R.matrixWorldInverse),Je.setFromProjectionMatrix(q,vi,R.reversedDepth),k=this.localClippingEnabled,We=ee.init(this.clippingPlanes,k),d=F.get(p,w.length),d.init(),w.push(d),J.enabled===!0&&J.isPresenting===!0){const j=M.xr.getDepthSensingMesh();j!==null&&wn(j,R,-1/0,M.sortObjects)}wn(p,R,0,M.sortObjects),d.finish(),M.sortObjects===!0&&d.sort(ge,Me),Oe=J.enabled===!1||J.isPresenting===!1||J.hasDepthSensing()===!1,Oe&&me.addToRenderList(d,p),this.info.render.frame++,We===!0&&ee.beginShadows();const y=c.state.shadowsArray;he.render(y,p,R),We===!0&&ee.endShadows(),this.info.autoReset===!0&&this.info.reset();const O=d.opaque,b=d.transmissive;if(c.setupLights(),R.isArrayCamera){const j=R.cameras;if(b.length>0)for(let ae=0,fe=j.length;ae<fe;ae++){const se=j[ae];hi(O,b,p,se)}Oe&&me.render(p);for(let ae=0,fe=j.length;ae<fe;ae++){const se=j[ae];pi(d,p,se,se.viewport)}}else b.length>0&&hi(O,b,p,R),Oe&&me.render(p),pi(d,p,R);V!==null&&I===0&&(Ue.updateMultisampleRenderTarget(V),Ue.updateRenderTargetMipmap(V)),p.isScene===!0&&p.onAfterRender(M,p,R),re.resetDefaultState(),E=-1,g=null,A.pop(),A.length>0?(c=A[A.length-1],We===!0&&ee.setGlobalState(M.clippingPlanes,c.state.camera)):c=null,w.pop(),w.length>0?d=w[w.length-1]:d=null};function wn(p,R,y,O){if(p.visible===!1)return;if(p.layers.test(R.layers)){if(p.isGroup)y=p.renderOrder;else if(p.isLOD)p.autoUpdate===!0&&p.update(R);else if(p.isLight)c.pushLight(p),p.castShadow&&c.pushShadow(p);else if(p.isSprite){if(!p.frustumCulled||Je.intersectsSprite(p)){O&&be.setFromMatrixPosition(p.matrixWorld).applyMatrix4(q);const ae=U.update(p),fe=p.material;fe.visible&&d.push(p,ae,fe,y,be.z,null)}}else if((p.isMesh||p.isLine||p.isPoints)&&(!p.frustumCulled||Je.intersectsObject(p))){const ae=U.update(p),fe=p.material;if(O&&(p.boundingSphere!==void 0?(p.boundingSphere===null&&p.computeBoundingSphere(),be.copy(p.boundingSphere.center)):(ae.boundingSphere===null&&ae.computeBoundingSphere(),be.copy(ae.boundingSphere.center)),be.applyMatrix4(p.matrixWorld).applyMatrix4(q)),Array.isArray(fe)){const se=ae.groups;for(let xe=0,Ce=se.length;xe<Ce;xe++){const Se=se[xe],ye=fe[Se.materialIndex];ye&&ye.visible&&d.push(p,ae,ye,y,be.z,Se)}}else fe.visible&&d.push(p,ae,fe,y,be.z,null)}}const j=p.children;for(let ae=0,fe=j.length;ae<fe;ae++)wn(j[ae],R,y,O)}function pi(p,R,y,O){const b=p.opaque,j=p.transmissive,ae=p.transparent;c.setupLightsView(y),We===!0&&ee.setGlobalState(M.clippingPlanes,y),O&&de.viewport(P.copy(O)),b.length>0&&mn(b,R,y),j.length>0&&mn(j,R,y),ae.length>0&&mn(ae,R,y),de.buffers.depth.setTest(!0),de.buffers.depth.setMask(!0),de.buffers.color.setMask(!0),de.setPolygonOffset(!1)}function hi(p,R,y,O){if((y.isScene===!0?y.overrideMaterial:null)!==null)return;c.state.transmissionRenderTarget[O.id]===void 0&&(c.state.transmissionRenderTarget[O.id]=new en(1,1,{generateMipmaps:!0,type:Pe.has("EXT_color_buffer_half_float")||Pe.has("EXT_color_buffer_float")?bn:Xt,minFilter:Gt,samples:4,stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:tt.workingColorSpace}));const j=c.state.transmissionRenderTarget[O.id],ae=O.viewport||P;j.setSize(ae.z*M.transmissionResolutionScale,ae.w*M.transmissionResolutionScale);const fe=M.getRenderTarget(),se=M.getActiveCubeFace(),xe=M.getActiveMipmapLevel();M.setRenderTarget(j),M.getClearColor(K),$=M.getClearAlpha(),$<1&&M.setClearColor(16777215,.5),M.clear(),Oe&&me.render(y);const Ce=M.toneMapping;M.toneMapping=Ut;const Se=O.viewport;if(O.viewport!==void 0&&(O.viewport=void 0),c.setupLightsView(O),We===!0&&ee.setGlobalState(M.clippingPlanes,O),mn(p,y,O),Ue.updateMultisampleRenderTarget(j),Ue.updateRenderTargetMipmap(j),Pe.has("WEBGL_multisampled_render_to_texture")===!1){let ye=!1;for(let ze=0,et=R.length;ze<et;ze++){const Ye=R[ze],Xe=Ye.object,Te=Ye.geometry,je=Ye.material,Be=Ye.group;if(je.side===xt&&Xe.layers.test(O.layers)){const pt=je.side;je.side=Et,je.needsUpdate=!0,mi(Xe,y,O,Te,je,Be),je.side=pt,je.needsUpdate=!0,ye=!0}}ye===!0&&(Ue.updateMultisampleRenderTarget(j),Ue.updateRenderTargetMipmap(j))}M.setRenderTarget(fe,se,xe),M.setClearColor(K,$),Se!==void 0&&(O.viewport=Se),M.toneMapping=Ce}function mn(p,R,y){const O=R.isScene===!0?R.overrideMaterial:null;for(let b=0,j=p.length;b<j;b++){const ae=p[b],fe=ae.object,se=ae.geometry,xe=ae.group;let Ce=ae.material;Ce.allowOverride===!0&&O!==null&&(Ce=O),fe.layers.test(y.layers)&&mi(fe,R,y,se,Ce,xe)}}function mi(p,R,y,O,b,j){p.onBeforeRender(M,R,y,O,b,j),p.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,p.matrixWorld),p.normalMatrix.getNormalMatrix(p.modelViewMatrix),b.onBeforeRender(M,R,y,O,p,j),b.transparent===!0&&b.side===xt&&b.forceSinglePass===!1?(b.side=Et,b.needsUpdate=!0,M.renderBufferDirect(y,R,O,b,p,j),b.side=tn,b.needsUpdate=!0,M.renderBufferDirect(y,R,O,b,p,j),b.side=xt):M.renderBufferDirect(y,R,O,b,p,j),p.onAfterRender(M,R,y,O,b,j)}function _n(p,R,y){R.isScene!==!0&&(R=Ee);const O=pe.get(p),b=c.state.lights,j=c.state.shadowsArray,ae=b.state.version,fe=H.getParameters(p,b.state,j,R,y),se=H.getProgramCacheKey(fe);let xe=O.programs;O.environment=p.isMeshStandardMaterial?R.environment:null,O.fog=R.fog,O.envMap=(p.isMeshStandardMaterial?it:ot).get(p.envMap||O.environment),O.envMapRotation=O.environment!==null&&p.envMap===null?R.environmentRotation:p.envMapRotation,xe===void 0&&(p.addEventListener("dispose",z),xe=new Map,O.programs=xe);let Ce=xe.get(se);if(Ce!==void 0){if(O.currentProgram===Ce&&O.lightsStateVersion===ae)return gi(p,fe),Ce}else fe.uniforms=H.getUniforms(p),p.onBeforeCompile(fe,M),Ce=H.acquireProgram(fe,se),xe.set(se,Ce),O.uniforms=fe.uniforms;const Se=O.uniforms;return(!p.isShaderMaterial&&!p.isRawShaderMaterial||p.clipping===!0)&&(Se.clippingPlanes=ee.uniform),gi(p,fe),O.needsLights=ha(p),O.lightsStateVersion=ae,O.needsLights&&(Se.ambientLightColor.value=b.state.ambient,Se.lightProbe.value=b.state.probe,Se.directionalLights.value=b.state.directional,Se.directionalLightShadows.value=b.state.directionalShadow,Se.spotLights.value=b.state.spot,Se.spotLightShadows.value=b.state.spotShadow,Se.rectAreaLights.value=b.state.rectArea,Se.ltc_1.value=b.state.rectAreaLTC1,Se.ltc_2.value=b.state.rectAreaLTC2,Se.pointLights.value=b.state.point,Se.pointLightShadows.value=b.state.pointShadow,Se.hemisphereLights.value=b.state.hemi,Se.directionalShadowMap.value=b.state.directionalShadowMap,Se.directionalShadowMatrix.value=b.state.directionalShadowMatrix,Se.spotShadowMap.value=b.state.spotShadowMap,Se.spotLightMatrix.value=b.state.spotLightMatrix,Se.spotLightMap.value=b.state.spotLightMap,Se.pointShadowMap.value=b.state.pointShadowMap,Se.pointShadowMatrix.value=b.state.pointShadowMatrix),O.currentProgram=Ce,O.uniformsList=null,Ce}function _i(p){if(p.uniformsList===null){const R=p.currentProgram.getUniforms();p.uniformsList=Mn.seqWithValue(R.seq,p.uniforms)}return p.uniformsList}function gi(p,R){const y=pe.get(p);y.outputColorSpace=R.outputColorSpace,y.batching=R.batching,y.batchingColor=R.batchingColor,y.instancing=R.instancing,y.instancingColor=R.instancingColor,y.instancingMorph=R.instancingMorph,y.skinning=R.skinning,y.morphTargets=R.morphTargets,y.morphNormals=R.morphNormals,y.morphColors=R.morphColors,y.morphTargetsCount=R.morphTargetsCount,y.numClippingPlanes=R.numClippingPlanes,y.numIntersection=R.numClipIntersection,y.vertexAlphas=R.vertexAlphas,y.vertexTangents=R.vertexTangents,y.toneMapping=R.toneMapping}function da(p,R,y,O,b){R.isScene!==!0&&(R=Ee),Ue.resetTextureUnits();const j=R.fog,ae=O.isMeshStandardMaterial?R.environment:null,fe=V===null?M.outputColorSpace:V.isXRRenderTarget===!0?V.texture.colorSpace:mt,se=(O.isMeshStandardMaterial?it:ot).get(O.envMap||ae),xe=O.vertexColors===!0&&!!y.attributes.color&&y.attributes.color.itemSize===4,Ce=!!y.attributes.tangent&&(!!O.normalMap||O.anisotropy>0),Se=!!y.morphAttributes.position,ye=!!y.morphAttributes.normal,ze=!!y.morphAttributes.color;let et=Ut;O.toneMapped&&(V===null||V.isXRRenderTarget===!0)&&(et=M.toneMapping);const Ye=y.morphAttributes.position||y.morphAttributes.normal||y.morphAttributes.color,Xe=Ye!==void 0?Ye.length:0,Te=pe.get(O),je=c.state.lights;if(We===!0&&(k===!0||p!==g)){const lt=p===g&&O.id===E;ee.setState(O,p,lt)}let Be=!1;O.version===Te.__version?(Te.needsLights&&Te.lightsStateVersion!==je.state.version||Te.outputColorSpace!==fe||b.isBatchedMesh&&Te.batching===!1||!b.isBatchedMesh&&Te.batching===!0||b.isBatchedMesh&&Te.batchingColor===!0&&b.colorTexture===null||b.isBatchedMesh&&Te.batchingColor===!1&&b.colorTexture!==null||b.isInstancedMesh&&Te.instancing===!1||!b.isInstancedMesh&&Te.instancing===!0||b.isSkinnedMesh&&Te.skinning===!1||!b.isSkinnedMesh&&Te.skinning===!0||b.isInstancedMesh&&Te.instancingColor===!0&&b.instanceColor===null||b.isInstancedMesh&&Te.instancingColor===!1&&b.instanceColor!==null||b.isInstancedMesh&&Te.instancingMorph===!0&&b.morphTexture===null||b.isInstancedMesh&&Te.instancingMorph===!1&&b.morphTexture!==null||Te.envMap!==se||O.fog===!0&&Te.fog!==j||Te.numClippingPlanes!==void 0&&(Te.numClippingPlanes!==ee.numPlanes||Te.numIntersection!==ee.numIntersection)||Te.vertexAlphas!==xe||Te.vertexTangents!==Ce||Te.morphTargets!==Se||Te.morphNormals!==ye||Te.morphColors!==ze||Te.toneMapping!==et||Te.morphTargetsCount!==Xe)&&(Be=!0):(Be=!0,Te.__version=O.version);let pt=Te.currentProgram;Be===!0&&(pt=_n(O,R,b));let Yt=!1,ht=!1,an=!1;const Qe=pt.getUniforms(),_t=Te.uniforms;if(de.useProgram(pt.program)&&(Yt=!0,ht=!0,an=!0),O.id!==E&&(E=O.id,ht=!0),Yt||g!==p){de.buffers.depth.getReversed()&&p.reversedDepth!==!0&&(p._reversedDepth=!0,p.updateProjectionMatrix()),Qe.setValue(T,"projectionMatrix",p.projectionMatrix),Qe.setValue(T,"viewMatrix",p.matrixWorldInverse);const ft=Qe.map.cameraPosition;ft!==void 0&&ft.setValue(T,le.setFromMatrixPosition(p.matrixWorld)),Re.logarithmicDepthBuffer&&Qe.setValue(T,"logDepthBufFC",2/(Math.log(p.far+1)/Math.LN2)),(O.isMeshPhongMaterial||O.isMeshToonMaterial||O.isMeshLambertMaterial||O.isMeshBasicMaterial||O.isMeshStandardMaterial||O.isShaderMaterial)&&Qe.setValue(T,"isOrthographic",p.isOrthographicCamera===!0),g!==p&&(g=p,ht=!0,an=!0)}if(b.isSkinnedMesh){Qe.setOptional(T,b,"bindMatrix"),Qe.setOptional(T,b,"bindMatrixInverse");const lt=b.skeleton;lt&&(lt.boneTexture===null&&lt.computeBoneTexture(),Qe.setValue(T,"boneTexture",lt.boneTexture,Ue))}b.isBatchedMesh&&(Qe.setOptional(T,b,"batchingTexture"),Qe.setValue(T,"batchingTexture",b._matricesTexture,Ue),Qe.setOptional(T,b,"batchingIdTexture"),Qe.setValue(T,"batchingIdTexture",b._indirectTexture,Ue),Qe.setOptional(T,b,"batchingColorTexture"),b._colorsTexture!==null&&Qe.setValue(T,"batchingColorTexture",b._colorsTexture,Ue));const gt=y.morphAttributes;if((gt.position!==void 0||gt.normal!==void 0||gt.color!==void 0)&&Q.update(b,y,pt),(ht||Te.receiveShadow!==b.receiveShadow)&&(Te.receiveShadow=b.receiveShadow,Qe.setValue(T,"receiveShadow",b.receiveShadow)),O.isMeshGouraudMaterial&&O.envMap!==null&&(_t.envMap.value=se,_t.flipEnvMap.value=se.isCubeTexture&&se.isRenderTargetTexture===!1?-1:1),O.isMeshStandardMaterial&&O.envMap===null&&R.environment!==null&&(_t.envMapIntensity.value=R.environmentIntensity),ht&&(Qe.setValue(T,"toneMappingExposure",M.toneMappingExposure),Te.needsLights&&pa(_t,an),j&&O.fog===!0&&Y.refreshFogUniforms(_t,j),Y.refreshMaterialUniforms(_t,O,G,ne,c.state.transmissionRenderTarget[p.id]),Mn.upload(T,_i(Te),_t,Ue)),O.isShaderMaterial&&O.uniformsNeedUpdate===!0&&(Mn.upload(T,_i(Te),_t,Ue),O.uniformsNeedUpdate=!1),O.isSpriteMaterial&&Qe.setValue(T,"center",b.center),Qe.setValue(T,"modelViewMatrix",b.modelViewMatrix),Qe.setValue(T,"normalMatrix",b.normalMatrix),Qe.setValue(T,"modelMatrix",b.matrixWorld),O.isShaderMaterial||O.isRawShaderMaterial){const lt=O.uniformsGroups;for(let ft=0,Dn=lt.length;ft<Dn;ft++){const Nt=lt[ft];we.update(Nt,pt),we.bind(Nt,pt)}}return pt}function pa(p,R){p.ambientLightColor.needsUpdate=R,p.lightProbe.needsUpdate=R,p.directionalLights.needsUpdate=R,p.directionalLightShadows.needsUpdate=R,p.pointLights.needsUpdate=R,p.pointLightShadows.needsUpdate=R,p.spotLights.needsUpdate=R,p.spotLightShadows.needsUpdate=R,p.rectAreaLights.needsUpdate=R,p.hemisphereLights.needsUpdate=R}function ha(p){return p.isMeshLambertMaterial||p.isMeshToonMaterial||p.isMeshPhongMaterial||p.isMeshStandardMaterial||p.isShadowMaterial||p.isShaderMaterial&&p.lights===!0}this.getActiveCubeFace=function(){return L},this.getActiveMipmapLevel=function(){return I},this.getRenderTarget=function(){return V},this.setRenderTargetTextures=function(p,R,y){const O=pe.get(p);O.__autoAllocateDepthBuffer=p.resolveDepthBuffer===!1,O.__autoAllocateDepthBuffer===!1&&(O.__useRenderToTexture=!1),pe.get(p.texture).__webglTexture=R,pe.get(p.depthTexture).__webglTexture=O.__autoAllocateDepthBuffer?void 0:y,O.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(p,R){const y=pe.get(p);y.__webglFramebuffer=R,y.__useDefaultFramebuffer=R===void 0};const ma=T.createFramebuffer();this.setRenderTarget=function(p,R=0,y=0){V=p,L=R,I=y;let O=!0,b=null,j=!1,ae=!1;if(p){const se=pe.get(p);if(se.__useDefaultFramebuffer!==void 0)de.bindFramebuffer(T.FRAMEBUFFER,null),O=!1;else if(se.__webglFramebuffer===void 0)Ue.setupRenderTarget(p);else if(se.__hasExternalTextures)Ue.rebindTextures(p,pe.get(p.texture).__webglTexture,pe.get(p.depthTexture).__webglTexture);else if(p.depthBuffer){const Se=p.depthTexture;if(se.__boundDepthTexture!==Se){if(Se!==null&&pe.has(Se)&&(p.width!==Se.image.width||p.height!==Se.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Ue.setupDepthRenderbuffer(p)}}const xe=p.texture;(xe.isData3DTexture||xe.isDataArrayTexture||xe.isCompressedArrayTexture)&&(ae=!0);const Ce=pe.get(p).__webglFramebuffer;p.isWebGLCubeRenderTarget?(Array.isArray(Ce[R])?b=Ce[R][y]:b=Ce[R],j=!0):p.samples>0&&Ue.useMultisampledRTT(p)===!1?b=pe.get(p).__webglMultisampledFramebuffer:Array.isArray(Ce)?b=Ce[y]:b=Ce,P.copy(p.viewport),B.copy(p.scissor),X=p.scissorTest}else P.copy(De).multiplyScalar(G).floor(),B.copy(Ve).multiplyScalar(G).floor(),X=nt;if(y!==0&&(b=ma),de.bindFramebuffer(T.FRAMEBUFFER,b)&&O&&de.drawBuffers(p,b),de.viewport(P),de.scissor(B),de.setScissorTest(X),j){const se=pe.get(p.texture);T.framebufferTexture2D(T.FRAMEBUFFER,T.COLOR_ATTACHMENT0,T.TEXTURE_CUBE_MAP_POSITIVE_X+R,se.__webglTexture,y)}else if(ae){const se=R;for(let xe=0;xe<p.textures.length;xe++){const Ce=pe.get(p.textures[xe]);T.framebufferTextureLayer(T.FRAMEBUFFER,T.COLOR_ATTACHMENT0+xe,Ce.__webglTexture,y,se)}}else if(p!==null&&y!==0){const se=pe.get(p.texture);T.framebufferTexture2D(T.FRAMEBUFFER,T.COLOR_ATTACHMENT0,T.TEXTURE_2D,se.__webglTexture,y)}E=-1},this.readRenderTargetPixels=function(p,R,y,O,b,j,ae,fe=0){if(!(p&&p.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let se=pe.get(p).__webglFramebuffer;if(p.isWebGLCubeRenderTarget&&ae!==void 0&&(se=se[ae]),se){de.bindFramebuffer(T.FRAMEBUFFER,se);try{const xe=p.textures[fe],Ce=xe.format,Se=xe.type;if(!Re.textureFormatReadable(Ce)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Re.textureTypeReadable(Se)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}R>=0&&R<=p.width-O&&y>=0&&y<=p.height-b&&(p.textures.length>1&&T.readBuffer(T.COLOR_ATTACHMENT0+fe),T.readPixels(R,y,O,b,_e.convert(Ce),_e.convert(Se),j))}finally{const xe=V!==null?pe.get(V).__webglFramebuffer:null;de.bindFramebuffer(T.FRAMEBUFFER,xe)}}},this.readRenderTargetPixelsAsync=async function(p,R,y,O,b,j,ae,fe=0){if(!(p&&p.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let se=pe.get(p).__webglFramebuffer;if(p.isWebGLCubeRenderTarget&&ae!==void 0&&(se=se[ae]),se)if(R>=0&&R<=p.width-O&&y>=0&&y<=p.height-b){de.bindFramebuffer(T.FRAMEBUFFER,se);const xe=p.textures[fe],Ce=xe.format,Se=xe.type;if(!Re.textureFormatReadable(Ce))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Re.textureTypeReadable(Se))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const ye=T.createBuffer();T.bindBuffer(T.PIXEL_PACK_BUFFER,ye),T.bufferData(T.PIXEL_PACK_BUFFER,j.byteLength,T.STREAM_READ),p.textures.length>1&&T.readBuffer(T.COLOR_ATTACHMENT0+fe),T.readPixels(R,y,O,b,_e.convert(Ce),_e.convert(Se),0);const ze=V!==null?pe.get(V).__webglFramebuffer:null;de.bindFramebuffer(T.FRAMEBUFFER,ze);const et=T.fenceSync(T.SYNC_GPU_COMMANDS_COMPLETE,0);return T.flush(),await Sa(T,et,4),T.bindBuffer(T.PIXEL_PACK_BUFFER,ye),T.getBufferSubData(T.PIXEL_PACK_BUFFER,0,j),T.deleteBuffer(ye),T.deleteSync(et),j}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(p,R=null,y=0){const O=Math.pow(2,-y),b=Math.floor(p.image.width*O),j=Math.floor(p.image.height*O),ae=R!==null?R.x:0,fe=R!==null?R.y:0;Ue.setTexture2D(p,0),T.copyTexSubImage2D(T.TEXTURE_2D,y,0,0,ae,fe,b,j),de.unbindTexture()};const _a=T.createFramebuffer(),ga=T.createFramebuffer();this.copyTextureToTexture=function(p,R,y=null,O=null,b=0,j=null){j===null&&(b!==0?(qn("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),j=b,b=0):j=0);let ae,fe,se,xe,Ce,Se,ye,ze,et;const Ye=p.isCompressedTexture?p.mipmaps[j]:p.image;if(y!==null)ae=y.max.x-y.min.x,fe=y.max.y-y.min.y,se=y.isBox3?y.max.z-y.min.z:1,xe=y.min.x,Ce=y.min.y,Se=y.isBox3?y.min.z:0;else{const gt=Math.pow(2,-b);ae=Math.floor(Ye.width*gt),fe=Math.floor(Ye.height*gt),p.isDataArrayTexture?se=Ye.depth:p.isData3DTexture?se=Math.floor(Ye.depth*gt):se=1,xe=0,Ce=0,Se=0}O!==null?(ye=O.x,ze=O.y,et=O.z):(ye=0,ze=0,et=0);const Xe=_e.convert(R.format),Te=_e.convert(R.type);let je;R.isData3DTexture?(Ue.setTexture3D(R,0),je=T.TEXTURE_3D):R.isDataArrayTexture||R.isCompressedArrayTexture?(Ue.setTexture2DArray(R,0),je=T.TEXTURE_2D_ARRAY):(Ue.setTexture2D(R,0),je=T.TEXTURE_2D),T.pixelStorei(T.UNPACK_FLIP_Y_WEBGL,R.flipY),T.pixelStorei(T.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),T.pixelStorei(T.UNPACK_ALIGNMENT,R.unpackAlignment);const Be=T.getParameter(T.UNPACK_ROW_LENGTH),pt=T.getParameter(T.UNPACK_IMAGE_HEIGHT),Yt=T.getParameter(T.UNPACK_SKIP_PIXELS),ht=T.getParameter(T.UNPACK_SKIP_ROWS),an=T.getParameter(T.UNPACK_SKIP_IMAGES);T.pixelStorei(T.UNPACK_ROW_LENGTH,Ye.width),T.pixelStorei(T.UNPACK_IMAGE_HEIGHT,Ye.height),T.pixelStorei(T.UNPACK_SKIP_PIXELS,xe),T.pixelStorei(T.UNPACK_SKIP_ROWS,Ce),T.pixelStorei(T.UNPACK_SKIP_IMAGES,Se);const Qe=p.isDataArrayTexture||p.isData3DTexture,_t=R.isDataArrayTexture||R.isData3DTexture;if(p.isDepthTexture){const gt=pe.get(p),lt=pe.get(R),ft=pe.get(gt.__renderTarget),Dn=pe.get(lt.__renderTarget);de.bindFramebuffer(T.READ_FRAMEBUFFER,ft.__webglFramebuffer),de.bindFramebuffer(T.DRAW_FRAMEBUFFER,Dn.__webglFramebuffer);for(let Nt=0;Nt<se;Nt++)Qe&&(T.framebufferTextureLayer(T.READ_FRAMEBUFFER,T.COLOR_ATTACHMENT0,pe.get(p).__webglTexture,b,Se+Nt),T.framebufferTextureLayer(T.DRAW_FRAMEBUFFER,T.COLOR_ATTACHMENT0,pe.get(R).__webglTexture,j,et+Nt)),T.blitFramebuffer(xe,Ce,ae,fe,ye,ze,ae,fe,T.DEPTH_BUFFER_BIT,T.NEAREST);de.bindFramebuffer(T.READ_FRAMEBUFFER,null),de.bindFramebuffer(T.DRAW_FRAMEBUFFER,null)}else if(b!==0||p.isRenderTargetTexture||pe.has(p)){const gt=pe.get(p),lt=pe.get(R);de.bindFramebuffer(T.READ_FRAMEBUFFER,_a),de.bindFramebuffer(T.DRAW_FRAMEBUFFER,ga);for(let ft=0;ft<se;ft++)Qe?T.framebufferTextureLayer(T.READ_FRAMEBUFFER,T.COLOR_ATTACHMENT0,gt.__webglTexture,b,Se+ft):T.framebufferTexture2D(T.READ_FRAMEBUFFER,T.COLOR_ATTACHMENT0,T.TEXTURE_2D,gt.__webglTexture,b),_t?T.framebufferTextureLayer(T.DRAW_FRAMEBUFFER,T.COLOR_ATTACHMENT0,lt.__webglTexture,j,et+ft):T.framebufferTexture2D(T.DRAW_FRAMEBUFFER,T.COLOR_ATTACHMENT0,T.TEXTURE_2D,lt.__webglTexture,j),b!==0?T.blitFramebuffer(xe,Ce,ae,fe,ye,ze,ae,fe,T.COLOR_BUFFER_BIT,T.NEAREST):_t?T.copyTexSubImage3D(je,j,ye,ze,et+ft,xe,Ce,ae,fe):T.copyTexSubImage2D(je,j,ye,ze,xe,Ce,ae,fe);de.bindFramebuffer(T.READ_FRAMEBUFFER,null),de.bindFramebuffer(T.DRAW_FRAMEBUFFER,null)}else _t?p.isDataTexture||p.isData3DTexture?T.texSubImage3D(je,j,ye,ze,et,ae,fe,se,Xe,Te,Ye.data):R.isCompressedArrayTexture?T.compressedTexSubImage3D(je,j,ye,ze,et,ae,fe,se,Xe,Ye.data):T.texSubImage3D(je,j,ye,ze,et,ae,fe,se,Xe,Te,Ye):p.isDataTexture?T.texSubImage2D(T.TEXTURE_2D,j,ye,ze,ae,fe,Xe,Te,Ye.data):p.isCompressedTexture?T.compressedTexSubImage2D(T.TEXTURE_2D,j,ye,ze,Ye.width,Ye.height,Xe,Ye.data):T.texSubImage2D(T.TEXTURE_2D,j,ye,ze,ae,fe,Xe,Te,Ye);T.pixelStorei(T.UNPACK_ROW_LENGTH,Be),T.pixelStorei(T.UNPACK_IMAGE_HEIGHT,pt),T.pixelStorei(T.UNPACK_SKIP_PIXELS,Yt),T.pixelStorei(T.UNPACK_SKIP_ROWS,ht),T.pixelStorei(T.UNPACK_SKIP_IMAGES,an),j===0&&R.generateMipmaps&&T.generateMipmap(je),de.unbindTexture()},this.initRenderTarget=function(p){pe.get(p).__webglFramebuffer===void 0&&Ue.setupRenderTarget(p)},this.initTexture=function(p){p.isCubeTexture?Ue.setTextureCube(p,0):p.isData3DTexture?Ue.setTexture3D(p,0):p.isDataArrayTexture||p.isCompressedArrayTexture?Ue.setTexture2DArray(p,0):Ue.setTexture2D(p,0),de.unbindTexture()},this.resetState=function(){L=0,I=0,V=null,de.reset(),re.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return vi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(n){this._outputColorSpace=n;const t=this.getContext();t.drawingBufferColorSpace=tt._getDrawingBufferColorSpace(n),t.unpackColorSpace=tt._getUnpackColorSpace()}}function br(e,n){if(n===No)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),e;if(n===ai||n===Jr){let t=e.getIndex();if(t===null){const o=[],s=e.getAttribute("position");if(s!==void 0){for(let l=0;l<s.count;l++)o.push(l);e.setIndex(o),t=e.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),e}const i=t.count-2,r=[];if(n===ai)for(let o=1;o<=i;o++)r.push(t.getX(0)),r.push(t.getX(o)),r.push(t.getX(o+1));else for(let o=0;o<i;o++)o%2===0?(r.push(t.getX(o)),r.push(t.getX(o+1)),r.push(t.getX(o+2))):(r.push(t.getX(o+2)),r.push(t.getX(o+1)),r.push(t.getX(o)));r.length/3!==i&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const a=e.clone();return a.setIndex(r),a.clearGroups(),a}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",n),e}class Rd extends yo{constructor(n){super(n),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Yu(t)}),this.register(function(t){return new qu(t)}),this.register(function(t){return new id(t)}),this.register(function(t){return new rd(t)}),this.register(function(t){return new ad(t)}),this.register(function(t){return new Zu(t)}),this.register(function(t){return new ju(t)}),this.register(function(t){return new Qu(t)}),this.register(function(t){return new Ju(t)}),this.register(function(t){return new Ku(t)}),this.register(function(t){return new ed(t)}),this.register(function(t){return new $u(t)}),this.register(function(t){return new nd(t)}),this.register(function(t){return new td(t)}),this.register(function(t){return new Wu(t)}),this.register(function(t){return new od(t)}),this.register(function(t){return new sd(t)})}load(n,t,i,r){const a=this;let o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){const u=un.extractUrlBase(n);o=un.resolveURL(u,this.path)}else o=un.extractUrlBase(n);this.manager.itemStart(n);const s=function(u){r?r(u):console.error(u),a.manager.itemError(n),a.manager.itemEnd(n)},l=new ea(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(n,function(u){try{a.parse(u,o,function(m){t(m),a.manager.itemEnd(n)},s)}catch(m){s(m)}},i,s)}setDRACOLoader(n){return this.dracoLoader=n,this}setKTX2Loader(n){return this.ktx2Loader=n,this}setMeshoptDecoder(n){return this.meshoptDecoder=n,this}register(n){return this.pluginCallbacks.indexOf(n)===-1&&this.pluginCallbacks.push(n),this}unregister(n){return this.pluginCallbacks.indexOf(n)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(n),1),this}parse(n,t,i,r){let a;const o={},s={},l=new TextDecoder;if(typeof n=="string")a=JSON.parse(n);else if(n instanceof ArrayBuffer)if(l.decode(new Uint8Array(n,0,4))===fa){try{o[Ne.KHR_BINARY_GLTF]=new cd(n)}catch(h){r&&r(h);return}a=JSON.parse(o[Ne.KHR_BINARY_GLTF].content)}else a=JSON.parse(l.decode(n));else a=n;if(a.asset===void 0||a.asset.version[0]<2){r&&r(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const u=new Td(a,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});u.fileLoader.setRequestHeader(this.requestHeader);for(let m=0;m<this.pluginCallbacks.length;m++){const h=this.pluginCallbacks[m](u);h.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),s[h.name]=h,o[h.name]=!0}if(a.extensionsUsed)for(let m=0;m<a.extensionsUsed.length;++m){const h=a.extensionsUsed[m],_=a.extensionsRequired||[];switch(h){case Ne.KHR_MATERIALS_UNLIT:o[h]=new Xu;break;case Ne.KHR_DRACO_MESH_COMPRESSION:o[h]=new ld(a,this.dracoLoader);break;case Ne.KHR_TEXTURE_TRANSFORM:o[h]=new fd;break;case Ne.KHR_MESH_QUANTIZATION:o[h]=new ud;break;default:_.indexOf(h)>=0&&s[h]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+h+'".')}}u.setExtensions(o),u.setPlugins(s),u.parse(i,r)}parseAsync(n,t){const i=this;return new Promise(function(r,a){i.parse(n,t,r,a)})}}function zu(){let e={};return{get:function(n){return e[n]},add:function(n,t){e[n]=t},remove:function(n){delete e[n]},removeAll:function(){e={}}}}const Ne={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class Wu{constructor(n){this.parser=n,this.name=Ne.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const n=this.parser,t=this.parser.json.nodes||[];for(let i=0,r=t.length;i<r;i++){const a=t[i];a.extensions&&a.extensions[this.name]&&a.extensions[this.name].light!==void 0&&n._addNodeRef(this.cache,a.extensions[this.name].light)}}_loadLight(n){const t=this.parser,i="light:"+n;let r=t.cache.get(i);if(r)return r;const a=t.json,l=((a.extensions&&a.extensions[this.name]||{}).lights||[])[n];let u;const m=new Ge(16777215);l.color!==void 0&&m.setRGB(l.color[0],l.color[1],l.color[2],mt);const h=l.range!==void 0?l.range:0;switch(l.type){case"directional":u=new Bo(m),u.target.position.set(0,0,-1),u.add(u.target);break;case"point":u=new Fo(m),u.distance=h;break;case"spot":u=new Oo(m),u.distance=h,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,u.angle=l.spot.outerConeAngle,u.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,u.target.position.set(0,0,-1),u.add(u.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return u.position.set(0,0,0),Tt(u,l),l.intensity!==void 0&&(u.intensity=l.intensity),u.name=t.createUniqueName(l.name||"light_"+n),r=Promise.resolve(u),t.cache.add(i,r),r}getDependency(n,t){if(n==="light")return this._loadLight(t)}createNodeAttachment(n){const t=this,i=this.parser,a=i.json.nodes[n],s=(a.extensions&&a.extensions[this.name]||{}).light;return s===void 0?null:this._loadLight(s).then(function(l){return i._getNodeRef(t.cache,s,l)})}}class Xu{constructor(){this.name=Ne.KHR_MATERIALS_UNLIT}getMaterialType(){return Zt}extendParams(n,t,i){const r=[];n.color=new Ge(1,1,1),n.opacity=1;const a=t.pbrMetallicRoughness;if(a){if(Array.isArray(a.baseColorFactor)){const o=a.baseColorFactor;n.color.setRGB(o[0],o[1],o[2],mt),n.opacity=o[3]}a.baseColorTexture!==void 0&&r.push(i.assignTexture(n,"map",a.baseColorTexture,Jt))}return Promise.all(r)}}class Ku{constructor(n){this.parser=n,this.name=Ne.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(n,t){const r=this.parser.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=r.extensions[this.name].emissiveStrength;return a!==void 0&&(t.emissiveIntensity=a),Promise.resolve()}}class Yu{constructor(n){this.parser=n,this.name=Ne.KHR_MATERIALS_CLEARCOAT}getMaterialType(n){const i=this.parser.json.materials[n];return!i.extensions||!i.extensions[this.name]?null:At}extendMaterialParams(n,t){const i=this.parser,r=i.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=[],o=r.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&a.push(i.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&a.push(i.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(a.push(i.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){const s=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new ct(s,s)}return Promise.all(a)}}class qu{constructor(n){this.parser=n,this.name=Ne.KHR_MATERIALS_DISPERSION}getMaterialType(n){const i=this.parser.json.materials[n];return!i.extensions||!i.extensions[this.name]?null:At}extendMaterialParams(n,t){const r=this.parser.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=r.extensions[this.name];return t.dispersion=a.dispersion!==void 0?a.dispersion:0,Promise.resolve()}}class $u{constructor(n){this.parser=n,this.name=Ne.KHR_MATERIALS_IRIDESCENCE}getMaterialType(n){const i=this.parser.json.materials[n];return!i.extensions||!i.extensions[this.name]?null:At}extendMaterialParams(n,t){const i=this.parser,r=i.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=[],o=r.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&a.push(i.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&a.push(i.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(a)}}class Zu{constructor(n){this.parser=n,this.name=Ne.KHR_MATERIALS_SHEEN}getMaterialType(n){const i=this.parser.json.materials[n];return!i.extensions||!i.extensions[this.name]?null:At}extendMaterialParams(n,t){const i=this.parser,r=i.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=[];t.sheenColor=new Ge(0,0,0),t.sheenRoughness=0,t.sheen=1;const o=r.extensions[this.name];if(o.sheenColorFactor!==void 0){const s=o.sheenColorFactor;t.sheenColor.setRGB(s[0],s[1],s[2],mt)}return o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&a.push(i.assignTexture(t,"sheenColorMap",o.sheenColorTexture,Jt)),o.sheenRoughnessTexture!==void 0&&a.push(i.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(a)}}class ju{constructor(n){this.parser=n,this.name=Ne.KHR_MATERIALS_TRANSMISSION}getMaterialType(n){const i=this.parser.json.materials[n];return!i.extensions||!i.extensions[this.name]?null:At}extendMaterialParams(n,t){const i=this.parser,r=i.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=[],o=r.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&a.push(i.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(a)}}class Qu{constructor(n){this.parser=n,this.name=Ne.KHR_MATERIALS_VOLUME}getMaterialType(n){const i=this.parser.json.materials[n];return!i.extensions||!i.extensions[this.name]?null:At}extendMaterialParams(n,t){const i=this.parser,r=i.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=[],o=r.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&a.push(i.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;const s=o.attenuationColor||[1,1,1];return t.attenuationColor=new Ge().setRGB(s[0],s[1],s[2],mt),Promise.all(a)}}class Ju{constructor(n){this.parser=n,this.name=Ne.KHR_MATERIALS_IOR}getMaterialType(n){const i=this.parser.json.materials[n];return!i.extensions||!i.extensions[this.name]?null:At}extendMaterialParams(n,t){const r=this.parser.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=r.extensions[this.name];return t.ior=a.ior!==void 0?a.ior:1.5,Promise.resolve()}}class ed{constructor(n){this.parser=n,this.name=Ne.KHR_MATERIALS_SPECULAR}getMaterialType(n){const i=this.parser.json.materials[n];return!i.extensions||!i.extensions[this.name]?null:At}extendMaterialParams(n,t){const i=this.parser,r=i.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=[],o=r.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&a.push(i.assignTexture(t,"specularIntensityMap",o.specularTexture));const s=o.specularColorFactor||[1,1,1];return t.specularColor=new Ge().setRGB(s[0],s[1],s[2],mt),o.specularColorTexture!==void 0&&a.push(i.assignTexture(t,"specularColorMap",o.specularColorTexture,Jt)),Promise.all(a)}}class td{constructor(n){this.parser=n,this.name=Ne.EXT_MATERIALS_BUMP}getMaterialType(n){const i=this.parser.json.materials[n];return!i.extensions||!i.extensions[this.name]?null:At}extendMaterialParams(n,t){const i=this.parser,r=i.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=[],o=r.extensions[this.name];return t.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&a.push(i.assignTexture(t,"bumpMap",o.bumpTexture)),Promise.all(a)}}class nd{constructor(n){this.parser=n,this.name=Ne.KHR_MATERIALS_ANISOTROPY}getMaterialType(n){const i=this.parser.json.materials[n];return!i.extensions||!i.extensions[this.name]?null:At}extendMaterialParams(n,t){const i=this.parser,r=i.json.materials[n];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();const a=[],o=r.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&a.push(i.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(a)}}class id{constructor(n){this.parser=n,this.name=Ne.KHR_TEXTURE_BASISU}loadTexture(n){const t=this.parser,i=t.json,r=i.textures[n];if(!r.extensions||!r.extensions[this.name])return null;const a=r.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(n,a.source,o)}}class rd{constructor(n){this.parser=n,this.name=Ne.EXT_TEXTURE_WEBP}loadTexture(n){const t=this.name,i=this.parser,r=i.json,a=r.textures[n];if(!a.extensions||!a.extensions[t])return null;const o=a.extensions[t],s=r.images[o.source];let l=i.textureLoader;if(s.uri){const u=i.options.manager.getHandler(s.uri);u!==null&&(l=u)}return i.loadTextureImage(n,o.source,l)}}class ad{constructor(n){this.parser=n,this.name=Ne.EXT_TEXTURE_AVIF}loadTexture(n){const t=this.name,i=this.parser,r=i.json,a=r.textures[n];if(!a.extensions||!a.extensions[t])return null;const o=a.extensions[t],s=r.images[o.source];let l=i.textureLoader;if(s.uri){const u=i.options.manager.getHandler(s.uri);u!==null&&(l=u)}return i.loadTextureImage(n,o.source,l)}}class od{constructor(n){this.name=Ne.EXT_MESHOPT_COMPRESSION,this.parser=n}loadBufferView(n){const t=this.parser.json,i=t.bufferViews[n];if(i.extensions&&i.extensions[this.name]){const r=i.extensions[this.name],a=this.parser.getDependency("buffer",r.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return a.then(function(s){const l=r.byteOffset||0,u=r.byteLength||0,m=r.count,h=r.byteStride,_=new Uint8Array(s,l,u);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(m,h,_,r.mode,r.filter).then(function(S){return S.buffer}):o.ready.then(function(){const S=new ArrayBuffer(m*h);return o.decodeGltfBuffer(new Uint8Array(S),m,h,_,r.mode,r.filter),S})})}else return null}}class sd{constructor(n){this.name=Ne.EXT_MESH_GPU_INSTANCING,this.parser=n}createNodeMesh(n){const t=this.parser.json,i=t.nodes[n];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;const r=t.meshes[i.mesh];for(const u of r.primitives)if(u.mode!==vt.TRIANGLES&&u.mode!==vt.TRIANGLE_STRIP&&u.mode!==vt.TRIANGLE_FAN&&u.mode!==void 0)return null;const o=i.extensions[this.name].attributes,s=[],l={};for(const u in o)s.push(this.parser.getDependency("accessor",o[u]).then(m=>(l[u]=m,l[u])));return s.length<1?null:(s.push(this.parser.createNodeMesh(n)),Promise.all(s).then(u=>{const m=u.pop(),h=m.isGroup?m.children:[m],_=u[0].count,S=[];for(const D of h){const C=new wt,d=new Fe,c=new ta,w=new Fe(1,1,1),A=new Ho(D.geometry,D.material,_);for(let M=0;M<_;M++)l.TRANSLATION&&d.fromBufferAttribute(l.TRANSLATION,M),l.ROTATION&&c.fromBufferAttribute(l.ROTATION,M),l.SCALE&&w.fromBufferAttribute(l.SCALE,M),A.setMatrixAt(M,C.compose(d,c,w));for(const M in l)if(M==="_COLOR_0"){const N=l[M];A.instanceColor=new Go(N.array,N.itemSize,N.normalized)}else M!=="TRANSLATION"&&M!=="ROTATION"&&M!=="SCALE"&&D.geometry.setAttribute(M,l[M]);na.prototype.copy.call(A,D),this.parser.assignFinalMaterial(A),S.push(A)}return m.isGroup?(m.clear(),m.add(...S),m):S[0]}))}}const fa="glTF",sn=12,Lr={JSON:1313821514,BIN:5130562};class cd{constructor(n){this.name=Ne.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(n,0,sn),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(n.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==fa)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const r=this.header.length-sn,a=new DataView(n,sn);let o=0;for(;o<r;){const s=a.getUint32(o,!0);o+=4;const l=a.getUint32(o,!0);if(o+=4,l===Lr.JSON){const u=new Uint8Array(n,sn+o,s);this.content=i.decode(u)}else if(l===Lr.BIN){const u=sn+o;this.body=n.slice(u,u+s)}o+=s}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class ld{constructor(n,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Ne.KHR_DRACO_MESH_COMPRESSION,this.json=n,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(n,t){const i=this.json,r=this.dracoLoader,a=n.extensions[this.name].bufferView,o=n.extensions[this.name].attributes,s={},l={},u={};for(const m in o){const h=si[m]||m.toLowerCase();s[h]=o[m]}for(const m in n.attributes){const h=si[m]||m.toLowerCase();if(o[m]!==void 0){const _=i.accessors[n.attributes[m]],S=Qt[_.componentType];u[h]=S.name,l[h]=_.normalized===!0}}return t.getDependency("bufferView",a).then(function(m){return new Promise(function(h,_){r.decodeDracoFile(m,function(S){for(const D in S.attributes){const C=S.attributes[D],d=l[D];d!==void 0&&(C.normalized=d)}h(S)},s,u,mt,_)})})}}class fd{constructor(){this.name=Ne.KHR_TEXTURE_TRANSFORM}extendTexture(n,t){return(t.texCoord===void 0||t.texCoord===n.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(n=n.clone(),t.texCoord!==void 0&&(n.channel=t.texCoord),t.offset!==void 0&&n.offset.fromArray(t.offset),t.rotation!==void 0&&(n.rotation=t.rotation),t.scale!==void 0&&n.repeat.fromArray(t.scale),n.needsUpdate=!0),n}}class ud{constructor(){this.name=Ne.KHR_MESH_QUANTIZATION}}class ua extends rs{constructor(n,t,i,r){super(n,t,i,r)}copySampleValue_(n){const t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,a=n*r*3+r;for(let o=0;o!==r;o++)t[o]=i[a+o];return t}interpolate_(n,t,i,r){const a=this.resultBuffer,o=this.sampleValues,s=this.valueSize,l=s*2,u=s*3,m=r-t,h=(i-t)/m,_=h*h,S=_*h,D=n*u,C=D-u,d=-2*S+3*_,c=S-_,w=1-d,A=c-_+h;for(let M=0;M!==s;M++){const N=o[C+M+s],L=o[C+M+l]*m,I=o[D+M+s],V=o[D+M]*m;a[M]=w*N+A*L+d*I+c*V}return a}}const dd=new ta;class pd extends ua{interpolate_(n,t,i,r){const a=super.interpolate_(n,t,i,r);return dd.fromArray(a).normalize().toArray(a),a}}const vt={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},Qt={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Pr={9728:kt,9729:Lt,9984:Or,9985:Sn,9986:cn,9987:Gt},wr={33071:yr,33648:Nr,10497:Rn},Xn={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},si={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Dt={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},hd={CUBICSPLINE:void 0,LINEAR:ra,STEP:ns},Kn={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function md(e){return e.DefaultMaterial===void 0&&(e.DefaultMaterial=new ia({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:tn})),e.DefaultMaterial}function Ft(e,n,t){for(const i in t.extensions)e[i]===void 0&&(n.userData.gltfExtensions=n.userData.gltfExtensions||{},n.userData.gltfExtensions[i]=t.extensions[i])}function Tt(e,n){n.extras!==void 0&&(typeof n.extras=="object"?Object.assign(e.userData,n.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+n.extras))}function _d(e,n,t){let i=!1,r=!1,a=!1;for(let u=0,m=n.length;u<m;u++){const h=n[u];if(h.POSITION!==void 0&&(i=!0),h.NORMAL!==void 0&&(r=!0),h.COLOR_0!==void 0&&(a=!0),i&&r&&a)break}if(!i&&!r&&!a)return Promise.resolve(e);const o=[],s=[],l=[];for(let u=0,m=n.length;u<m;u++){const h=n[u];if(i){const _=h.POSITION!==void 0?t.getDependency("accessor",h.POSITION):e.attributes.position;o.push(_)}if(r){const _=h.NORMAL!==void 0?t.getDependency("accessor",h.NORMAL):e.attributes.normal;s.push(_)}if(a){const _=h.COLOR_0!==void 0?t.getDependency("accessor",h.COLOR_0):e.attributes.color;l.push(_)}}return Promise.all([Promise.all(o),Promise.all(s),Promise.all(l)]).then(function(u){const m=u[0],h=u[1],_=u[2];return i&&(e.morphAttributes.position=m),r&&(e.morphAttributes.normal=h),a&&(e.morphAttributes.color=_),e.morphTargetsRelative=!0,e})}function gd(e,n){if(e.updateMorphTargets(),n.weights!==void 0)for(let t=0,i=n.weights.length;t<i;t++)e.morphTargetInfluences[t]=n.weights[t];if(n.extras&&Array.isArray(n.extras.targetNames)){const t=n.extras.targetNames;if(e.morphTargetInfluences.length===t.length){e.morphTargetDictionary={};for(let i=0,r=t.length;i<r;i++)e.morphTargetDictionary[t[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function vd(e){let n;const t=e.extensions&&e.extensions[Ne.KHR_DRACO_MESH_COMPRESSION];if(t?n="draco:"+t.bufferView+":"+t.indices+":"+Yn(t.attributes):n=e.indices+":"+Yn(e.attributes)+":"+e.mode,e.targets!==void 0)for(let i=0,r=e.targets.length;i<r;i++)n+=":"+Yn(e.targets[i]);return n}function Yn(e){let n="";const t=Object.keys(e).sort();for(let i=0,r=t.length;i<r;i++)n+=t[i]+":"+e[t[i]]+";";return n}function ci(e){switch(e){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Ed(e){return e.search(/\.jpe?g($|\?)/i)>0||e.search(/^data\:image\/jpeg/)===0?"image/jpeg":e.search(/\.webp($|\?)/i)>0||e.search(/^data\:image\/webp/)===0?"image/webp":e.search(/\.ktx2($|\?)/i)>0||e.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const Sd=new wt;class Td{constructor(n={},t={}){this.json=n,this.extensions={},this.plugins={},this.options=t,this.cache=new zu,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,r=-1,a=!1,o=-1;if(typeof navigator<"u"){const s=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(s)===!0;const l=s.match(/Version\/(\d+)/);r=i&&l?parseInt(l[1],10):-1,a=s.indexOf("Firefox")>-1,o=a?s.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&r<17||a&&o<98?this.textureLoader=new Vo(this.options.manager):this.textureLoader=new ko(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new ea(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(n){this.extensions=n}setPlugins(n){this.plugins=n}parse(n,t){const i=this,r=this.json,a=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(o){const s={scene:o[0][r.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:r.asset,parser:i,userData:{}};return Ft(a,s,r),Tt(s,r),Promise.all(i._invokeAll(function(l){return l.afterRoot&&l.afterRoot(s)})).then(function(){for(const l of s.scenes)l.updateMatrixWorld();n(s)})}).catch(t)}_markDefs(){const n=this.json.nodes||[],t=this.json.skins||[],i=this.json.meshes||[];for(let r=0,a=t.length;r<a;r++){const o=t[r].joints;for(let s=0,l=o.length;s<l;s++)n[o[s]].isBone=!0}for(let r=0,a=n.length;r<a;r++){const o=n[r];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(i[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(n,t){t!==void 0&&(n.refs[t]===void 0&&(n.refs[t]=n.uses[t]=0),n.refs[t]++)}_getNodeRef(n,t,i){if(n.refs[t]<=1)return i;const r=i.clone(),a=(o,s)=>{const l=this.associations.get(o);l!=null&&this.associations.set(s,l);for(const[u,m]of o.children.entries())a(m,s.children[u])};return a(i,r),r.name+="_instance_"+n.uses[t]++,r}_invokeOne(n){const t=Object.values(this.plugins);t.push(this);for(let i=0;i<t.length;i++){const r=n(t[i]);if(r)return r}return null}_invokeAll(n){const t=Object.values(this.plugins);t.unshift(this);const i=[];for(let r=0;r<t.length;r++){const a=n(t[r]);a&&i.push(a)}return i}getDependency(n,t){const i=n+":"+t;let r=this.cache.get(i);if(!r){switch(n){case"scene":r=this.loadScene(t);break;case"node":r=this._invokeOne(function(a){return a.loadNode&&a.loadNode(t)});break;case"mesh":r=this._invokeOne(function(a){return a.loadMesh&&a.loadMesh(t)});break;case"accessor":r=this.loadAccessor(t);break;case"bufferView":r=this._invokeOne(function(a){return a.loadBufferView&&a.loadBufferView(t)});break;case"buffer":r=this.loadBuffer(t);break;case"material":r=this._invokeOne(function(a){return a.loadMaterial&&a.loadMaterial(t)});break;case"texture":r=this._invokeOne(function(a){return a.loadTexture&&a.loadTexture(t)});break;case"skin":r=this.loadSkin(t);break;case"animation":r=this._invokeOne(function(a){return a.loadAnimation&&a.loadAnimation(t)});break;case"camera":r=this.loadCamera(t);break;default:if(r=this._invokeOne(function(a){return a!=this&&a.getDependency&&a.getDependency(n,t)}),!r)throw new Error("Unknown type: "+n);break}this.cache.add(i,r)}return r}getDependencies(n){let t=this.cache.get(n);if(!t){const i=this,r=this.json[n+(n==="mesh"?"es":"s")]||[];t=Promise.all(r.map(function(a,o){return i.getDependency(n,o)})),this.cache.add(n,t)}return t}loadBuffer(n){const t=this.json.buffers[n],i=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&n===0)return Promise.resolve(this.extensions[Ne.KHR_BINARY_GLTF].body);const r=this.options;return new Promise(function(a,o){i.load(un.resolveURL(t.uri,r.path),a,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(n){const t=this.json.bufferViews[n];return this.getDependency("buffer",t.buffer).then(function(i){const r=t.byteLength||0,a=t.byteOffset||0;return i.slice(a,a+r)})}loadAccessor(n){const t=this,i=this.json,r=this.json.accessors[n];if(r.bufferView===void 0&&r.sparse===void 0){const o=Xn[r.type],s=Qt[r.componentType],l=r.normalized===!0,u=new s(r.count*o);return Promise.resolve(new zt(u,o,l))}const a=[];return r.bufferView!==void 0?a.push(this.getDependency("bufferView",r.bufferView)):a.push(null),r.sparse!==void 0&&(a.push(this.getDependency("bufferView",r.sparse.indices.bufferView)),a.push(this.getDependency("bufferView",r.sparse.values.bufferView))),Promise.all(a).then(function(o){const s=o[0],l=Xn[r.type],u=Qt[r.componentType],m=u.BYTES_PER_ELEMENT,h=m*l,_=r.byteOffset||0,S=r.bufferView!==void 0?i.bufferViews[r.bufferView].byteStride:void 0,D=r.normalized===!0;let C,d;if(S&&S!==h){const c=Math.floor(_/S),w="InterleavedBuffer:"+r.bufferView+":"+r.componentType+":"+c+":"+r.count;let A=t.cache.get(w);A||(C=new u(s,c*S,r.count*S/m),A=new zo(C,S/m),t.cache.add(w,A)),d=new is(A,l,_%S/m,D)}else s===null?C=new u(r.count*l):C=new u(s,_,r.count*l),d=new zt(C,l,D);if(r.sparse!==void 0){const c=Xn.SCALAR,w=Qt[r.sparse.indices.componentType],A=r.sparse.indices.byteOffset||0,M=r.sparse.values.byteOffset||0,N=new w(o[1],A,r.sparse.count*c),L=new u(o[2],M,r.sparse.count*l);s!==null&&(d=new zt(d.array.slice(),d.itemSize,d.normalized)),d.normalized=!1;for(let I=0,V=N.length;I<V;I++){const E=N[I];if(d.setX(E,L[I*l]),l>=2&&d.setY(E,L[I*l+1]),l>=3&&d.setZ(E,L[I*l+2]),l>=4&&d.setW(E,L[I*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}d.normalized=D}return d})}loadTexture(n){const t=this.json,i=this.options,a=t.textures[n].source,o=t.images[a];let s=this.textureLoader;if(o.uri){const l=i.manager.getHandler(o.uri);l!==null&&(s=l)}return this.loadTextureImage(n,a,s)}loadTextureImage(n,t,i){const r=this,a=this.json,o=a.textures[n],s=a.images[t],l=(s.uri||s.bufferView)+":"+o.sampler;if(this.textureCache[l])return this.textureCache[l];const u=this.loadImageSource(t,i).then(function(m){m.flipY=!1,m.name=o.name||s.name||"",m.name===""&&typeof s.uri=="string"&&s.uri.startsWith("data:image/")===!1&&(m.name=s.uri);const _=(a.samplers||{})[o.sampler]||{};return m.magFilter=Pr[_.magFilter]||Lt,m.minFilter=Pr[_.minFilter]||Gt,m.wrapS=wr[_.wrapS]||Rn,m.wrapT=wr[_.wrapT]||Rn,m.generateMipmaps=!m.isCompressedTexture&&m.minFilter!==kt&&m.minFilter!==Lt,r.associations.set(m,{textures:n}),m}).catch(function(){return null});return this.textureCache[l]=u,u}loadImageSource(n,t){const i=this,r=this.json,a=this.options;if(this.sourceCache[n]!==void 0)return this.sourceCache[n].then(h=>h.clone());const o=r.images[n],s=self.URL||self.webkitURL;let l=o.uri||"",u=!1;if(o.bufferView!==void 0)l=i.getDependency("bufferView",o.bufferView).then(function(h){u=!0;const _=new Blob([h],{type:o.mimeType});return l=s.createObjectURL(_),l});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+n+" is missing URI and bufferView");const m=Promise.resolve(l).then(function(h){return new Promise(function(_,S){let D=_;t.isImageBitmapLoader===!0&&(D=function(C){const d=new ri(C);d.needsUpdate=!0,_(d)}),t.load(un.resolveURL(h,a.path),D,void 0,S)})}).then(function(h){return u===!0&&s.revokeObjectURL(l),Tt(h,o),h.userData.mimeType=o.mimeType||Ed(o.uri),h}).catch(function(h){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),h});return this.sourceCache[n]=m,m}assignTexture(n,t,i,r){const a=this;return this.getDependency("texture",i.index).then(function(o){if(!o)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(o=o.clone(),o.channel=i.texCoord),a.extensions[Ne.KHR_TEXTURE_TRANSFORM]){const s=i.extensions!==void 0?i.extensions[Ne.KHR_TEXTURE_TRANSFORM]:void 0;if(s){const l=a.associations.get(o);o=a.extensions[Ne.KHR_TEXTURE_TRANSFORM].extendTexture(o,s),a.associations.set(o,l)}}return r!==void 0&&(o.colorSpace=r),n[t]=o,o})}assignFinalMaterial(n){const t=n.geometry;let i=n.material;const r=t.attributes.tangent===void 0,a=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(n.isPoints){const s="PointsMaterial:"+i.uuid;let l=this.cache.get(s);l||(l=new Wo,Fn.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,l.sizeAttenuation=!1,this.cache.add(s,l)),i=l}else if(n.isLine){const s="LineBasicMaterial:"+i.uuid;let l=this.cache.get(s);l||(l=new Xo,Fn.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,this.cache.add(s,l)),i=l}if(r||a||o){let s="ClonedMaterial:"+i.uuid+":";r&&(s+="derivative-tangents:"),a&&(s+="vertex-colors:"),o&&(s+="flat-shading:");let l=this.cache.get(s);l||(l=i.clone(),a&&(l.vertexColors=!0),o&&(l.flatShading=!0),r&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(s,l),this.associations.set(l,this.associations.get(i))),i=l}n.material=i}getMaterialType(){return ia}loadMaterial(n){const t=this,i=this.json,r=this.extensions,a=i.materials[n];let o;const s={},l=a.extensions||{},u=[];if(l[Ne.KHR_MATERIALS_UNLIT]){const h=r[Ne.KHR_MATERIALS_UNLIT];o=h.getMaterialType(),u.push(h.extendParams(s,a,t))}else{const h=a.pbrMetallicRoughness||{};if(s.color=new Ge(1,1,1),s.opacity=1,Array.isArray(h.baseColorFactor)){const _=h.baseColorFactor;s.color.setRGB(_[0],_[1],_[2],mt),s.opacity=_[3]}h.baseColorTexture!==void 0&&u.push(t.assignTexture(s,"map",h.baseColorTexture,Jt)),s.metalness=h.metallicFactor!==void 0?h.metallicFactor:1,s.roughness=h.roughnessFactor!==void 0?h.roughnessFactor:1,h.metallicRoughnessTexture!==void 0&&(u.push(t.assignTexture(s,"metalnessMap",h.metallicRoughnessTexture)),u.push(t.assignTexture(s,"roughnessMap",h.metallicRoughnessTexture))),o=this._invokeOne(function(_){return _.getMaterialType&&_.getMaterialType(n)}),u.push(Promise.all(this._invokeAll(function(_){return _.extendMaterialParams&&_.extendMaterialParams(n,s)})))}a.doubleSided===!0&&(s.side=xt);const m=a.alphaMode||Kn.OPAQUE;if(m===Kn.BLEND?(s.transparent=!0,s.depthWrite=!1):(s.transparent=!1,m===Kn.MASK&&(s.alphaTest=a.alphaCutoff!==void 0?a.alphaCutoff:.5)),a.normalTexture!==void 0&&o!==Zt&&(u.push(t.assignTexture(s,"normalMap",a.normalTexture)),s.normalScale=new ct(1,1),a.normalTexture.scale!==void 0)){const h=a.normalTexture.scale;s.normalScale.set(h,h)}if(a.occlusionTexture!==void 0&&o!==Zt&&(u.push(t.assignTexture(s,"aoMap",a.occlusionTexture)),a.occlusionTexture.strength!==void 0&&(s.aoMapIntensity=a.occlusionTexture.strength)),a.emissiveFactor!==void 0&&o!==Zt){const h=a.emissiveFactor;s.emissive=new Ge().setRGB(h[0],h[1],h[2],mt)}return a.emissiveTexture!==void 0&&o!==Zt&&u.push(t.assignTexture(s,"emissiveMap",a.emissiveTexture,Jt)),Promise.all(u).then(function(){const h=new o(s);return a.name&&(h.name=a.name),Tt(h,a),t.associations.set(h,{materials:n}),a.extensions&&Ft(r,h,a),h})}createUniqueName(n){const t=Ko.sanitizeNodeName(n||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(n){const t=this,i=this.extensions,r=this.primitiveCache;function a(s){return i[Ne.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(s,t).then(function(l){return Dr(l,s,t)})}const o=[];for(let s=0,l=n.length;s<l;s++){const u=n[s],m=vd(u),h=r[m];if(h)o.push(h.promise);else{let _;u.extensions&&u.extensions[Ne.KHR_DRACO_MESH_COMPRESSION]?_=a(u):_=Dr(new fi,u,t),r[m]={primitive:u,promise:_},o.push(_)}}return Promise.all(o)}loadMesh(n){const t=this,i=this.json,r=this.extensions,a=i.meshes[n],o=a.primitives,s=[];for(let l=0,u=o.length;l<u;l++){const m=o[l].material===void 0?md(this.cache):this.getDependency("material",o[l].material);s.push(m)}return s.push(t.loadGeometries(o)),Promise.all(s).then(function(l){const u=l.slice(0,l.length-1),m=l[l.length-1],h=[];for(let S=0,D=m.length;S<D;S++){const C=m[S],d=o[S];let c;const w=u[S];if(d.mode===vt.TRIANGLES||d.mode===vt.TRIANGLE_STRIP||d.mode===vt.TRIANGLE_FAN||d.mode===void 0)c=a.isSkinnedMesh===!0?new Yo(C,w):new Pt(C,w),c.isSkinnedMesh===!0&&c.normalizeSkinWeights(),d.mode===vt.TRIANGLE_STRIP?c.geometry=br(c.geometry,Jr):d.mode===vt.TRIANGLE_FAN&&(c.geometry=br(c.geometry,ai));else if(d.mode===vt.LINES)c=new qo(C,w);else if(d.mode===vt.LINE_STRIP)c=new $o(C,w);else if(d.mode===vt.LINE_LOOP)c=new Zo(C,w);else if(d.mode===vt.POINTS)c=new jo(C,w);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+d.mode);Object.keys(c.geometry.morphAttributes).length>0&&gd(c,a),c.name=t.createUniqueName(a.name||"mesh_"+n),Tt(c,a),d.extensions&&Ft(r,c,d),t.assignFinalMaterial(c),h.push(c)}for(let S=0,D=h.length;S<D;S++)t.associations.set(h[S],{meshes:n,primitives:S});if(h.length===1)return a.extensions&&Ft(r,h[0],a),h[0];const _=new Bn;a.extensions&&Ft(r,_,a),t.associations.set(_,{meshes:n});for(let S=0,D=h.length;S<D;S++)_.add(h[S]);return _})}loadCamera(n){let t;const i=this.json.cameras[n],r=i[i.type];if(!r){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return i.type==="perspective"?t=new fn(Qo.radToDeg(r.yfov),r.aspectRatio||1,r.znear||1,r.zfar||2e6):i.type==="orthographic"&&(t=new Qr(-r.xmag,r.xmag,r.ymag,-r.ymag,r.znear,r.zfar)),i.name&&(t.name=this.createUniqueName(i.name)),Tt(t,i),Promise.resolve(t)}loadSkin(n){const t=this.json.skins[n],i=[];for(let r=0,a=t.joints.length;r<a;r++)i.push(this._loadNodeShallow(t.joints[r]));return t.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",t.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(r){const a=r.pop(),o=r,s=[],l=[];for(let u=0,m=o.length;u<m;u++){const h=o[u];if(h){s.push(h);const _=new wt;a!==null&&_.fromArray(a.array,u*16),l.push(_)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[u])}return new Jo(s,l)})}loadAnimation(n){const t=this.json,i=this,r=t.animations[n],a=r.name?r.name:"animation_"+n,o=[],s=[],l=[],u=[],m=[];for(let h=0,_=r.channels.length;h<_;h++){const S=r.channels[h],D=r.samplers[S.sampler],C=S.target,d=C.node,c=r.parameters!==void 0?r.parameters[D.input]:D.input,w=r.parameters!==void 0?r.parameters[D.output]:D.output;C.node!==void 0&&(o.push(this.getDependency("node",d)),s.push(this.getDependency("accessor",c)),l.push(this.getDependency("accessor",w)),u.push(D),m.push(C))}return Promise.all([Promise.all(o),Promise.all(s),Promise.all(l),Promise.all(u),Promise.all(m)]).then(function(h){const _=h[0],S=h[1],D=h[2],C=h[3],d=h[4],c=[];for(let A=0,M=_.length;A<M;A++){const N=_[A],L=S[A],I=D[A],V=C[A],E=d[A];if(N===void 0)continue;N.updateMatrix&&N.updateMatrix();const g=i._createAnimationTracks(N,L,I,V,E);if(g)for(let P=0;P<g.length;P++)c.push(g[P])}const w=new es(a,void 0,c);return Tt(w,r),w})}createNodeMesh(n){const t=this.json,i=this,r=t.nodes[n];return r.mesh===void 0?null:i.getDependency("mesh",r.mesh).then(function(a){const o=i._getNodeRef(i.meshCache,r.mesh,a);return r.weights!==void 0&&o.traverse(function(s){if(s.isMesh)for(let l=0,u=r.weights.length;l<u;l++)s.morphTargetInfluences[l]=r.weights[l]}),o})}loadNode(n){const t=this.json,i=this,r=t.nodes[n],a=i._loadNodeShallow(n),o=[],s=r.children||[];for(let u=0,m=s.length;u<m;u++)o.push(i.getDependency("node",s[u]));const l=r.skin===void 0?Promise.resolve(null):i.getDependency("skin",r.skin);return Promise.all([a,Promise.all(o),l]).then(function(u){const m=u[0],h=u[1],_=u[2];_!==null&&m.traverse(function(S){S.isSkinnedMesh&&S.bind(_,Sd)});for(let S=0,D=h.length;S<D;S++)m.add(h[S]);return m})}_loadNodeShallow(n){const t=this.json,i=this.extensions,r=this;if(this.nodeCache[n]!==void 0)return this.nodeCache[n];const a=t.nodes[n],o=a.name?r.createUniqueName(a.name):"",s=[],l=r._invokeOne(function(u){return u.createNodeMesh&&u.createNodeMesh(n)});return l&&s.push(l),a.camera!==void 0&&s.push(r.getDependency("camera",a.camera).then(function(u){return r._getNodeRef(r.cameraCache,a.camera,u)})),r._invokeAll(function(u){return u.createNodeAttachment&&u.createNodeAttachment(n)}).forEach(function(u){s.push(u)}),this.nodeCache[n]=Promise.all(s).then(function(u){let m;if(a.isBone===!0?m=new ts:u.length>1?m=new Bn:u.length===1?m=u[0]:m=new na,m!==u[0])for(let h=0,_=u.length;h<_;h++)m.add(u[h]);if(a.name&&(m.userData.name=a.name,m.name=o),Tt(m,a),a.extensions&&Ft(i,m,a),a.matrix!==void 0){const h=new wt;h.fromArray(a.matrix),m.applyMatrix4(h)}else a.translation!==void 0&&m.position.fromArray(a.translation),a.rotation!==void 0&&m.quaternion.fromArray(a.rotation),a.scale!==void 0&&m.scale.fromArray(a.scale);if(!r.associations.has(m))r.associations.set(m,{});else if(a.mesh!==void 0&&r.meshCache.refs[a.mesh]>1){const h=r.associations.get(m);r.associations.set(m,{...h})}return r.associations.get(m).nodes=n,m}),this.nodeCache[n]}loadScene(n){const t=this.extensions,i=this.json.scenes[n],r=this,a=new Bn;i.name&&(a.name=r.createUniqueName(i.name)),Tt(a,i),i.extensions&&Ft(t,a,i);const o=i.nodes||[],s=[];for(let l=0,u=o.length;l<u;l++)s.push(r.getDependency("node",o[l]));return Promise.all(s).then(function(l){for(let m=0,h=l.length;m<h;m++)a.add(l[m]);const u=m=>{const h=new Map;for(const[_,S]of r.associations)(_ instanceof Fn||_ instanceof ri)&&h.set(_,S);return m.traverse(_=>{const S=r.associations.get(_);S!=null&&h.set(_,S)}),h};return r.associations=u(a),a})}_createAnimationTracks(n,t,i,r,a){const o=[],s=n.name?n.name:n.uuid,l=[];Dt[a.path]===Dt.weights?n.traverse(function(_){_.morphTargetInfluences&&l.push(_.name?_.name:_.uuid)}):l.push(s);let u;switch(Dt[a.path]){case Dt.weights:u=tr;break;case Dt.rotation:u=nr;break;case Dt.translation:case Dt.scale:u=er;break;default:switch(i.itemSize){case 1:u=tr;break;case 2:case 3:default:u=er;break}break}const m=r.interpolation!==void 0?hd[r.interpolation]:ra,h=this._getArrayFromAccessor(i);for(let _=0,S=l.length;_<S;_++){const D=new u(l[_]+"."+Dt[a.path],t.array,h,m);r.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(D),o.push(D)}return o}_getArrayFromAccessor(n){let t=n.array;if(n.normalized){const i=ci(t.constructor),r=new Float32Array(t.length);for(let a=0,o=t.length;a<o;a++)r[a]=t[a]*i;t=r}return t}_createCubicSplineTrackInterpolant(n){n.createInterpolant=function(i){const r=this instanceof nr?pd:ua;return new r(this.times,this.values,this.getValueSize()/3,i)},n.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function Md(e,n,t){const i=n.attributes,r=new as;if(i.POSITION!==void 0){const s=t.json.accessors[i.POSITION],l=s.min,u=s.max;if(l!==void 0&&u!==void 0){if(r.set(new Fe(l[0],l[1],l[2]),new Fe(u[0],u[1],u[2])),s.normalized){const m=ci(Qt[s.componentType]);r.min.multiplyScalar(m),r.max.multiplyScalar(m)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const a=n.targets;if(a!==void 0){const s=new Fe,l=new Fe;for(let u=0,m=a.length;u<m;u++){const h=a[u];if(h.POSITION!==void 0){const _=t.json.accessors[h.POSITION],S=_.min,D=_.max;if(S!==void 0&&D!==void 0){if(l.setX(Math.max(Math.abs(S[0]),Math.abs(D[0]))),l.setY(Math.max(Math.abs(S[1]),Math.abs(D[1]))),l.setZ(Math.max(Math.abs(S[2]),Math.abs(D[2]))),_.normalized){const C=ci(Qt[_.componentType]);l.multiplyScalar(C)}s.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}r.expandByVector(s)}e.boundingBox=r;const o=new os;r.getCenter(o.center),o.radius=r.min.distanceTo(r.max)/2,e.boundingSphere=o}function Dr(e,n,t){const i=n.attributes,r=[];function a(o,s){return t.getDependency("accessor",o).then(function(l){e.setAttribute(s,l)})}for(const o in i){const s=si[o]||o.toLowerCase();s in e.attributes||r.push(a(i[o],s))}if(n.indices!==void 0&&!e.index){const o=t.getDependency("accessor",n.indices).then(function(s){e.setIndex(s)});r.push(o)}return tt.workingColorSpace!==mt&&"COLOR_0"in i&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${tt.workingColorSpace}" not supported.`),Tt(e,n),Md(e,n,t),Promise.all(r).then(function(){return n.targets!==void 0?_d(e,n.targets,t):e})}export{Rd as G,Ad as W};
