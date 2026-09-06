"""
AgriProof AI — End-to-End System Smoke Test
Executes a comprehensive live validation across all layers:
1. Health & Server Status
2. Satellite & Planet Insights Multi-Spectral Engine
3. Weather Risk Anomaly Scoring
4. Machine Learning Yield & Damage Prediction
5. Zero-Knowledge Proof (zk-SNARK Groth16) Generation & Verification
6. Tamper-Proof SHA-256 Claim Ledger & Chain Integrity
"""

import asyncio
import sys
import httpx
import json
from pathlib import Path

import argparse

parser = argparse.ArgumentParser(description="AgriProof AI Smoke Test")
parser.add_argument("--url", default="http://localhost:3000", help="Base backend URL")
parser.add_argument("--frontend", default="http://localhost:3000", help="Frontend URL")
cli_args, _ = parser.parse_known_args()

BASE_URL = cli_args.url
FRONTEND_URL = cli_args.frontend

def log_step(step: int, name: str, status: str = "RUNNING"):
    symbol = "*" if status == "RUNNING" else ("[PASS]" if status == "PASSED" else "[FAIL]")
    print(f"{symbol} Step {step}: {name} -> {status}")

async def run_smoke_test():
    print("\n" + "="*65)
    print(" AgriProof AI -- End-to-End System Smoke Test")
    print("="*65 + "\n")

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Health Check
        log_step(1, "Checking Backend Health Endpoint")
        try:
            res = await client.get(f"{BASE_URL}/health")
            assert res.status_code == 200, f"Expected 200, got {res.status_code}"
            assert res.json().get("status") == "healthy"
            log_step(1, "Checking Backend Health Endpoint", "PASSED")
        except Exception as e:
            log_step(1, f"Backend Health Failed: {e}", "FAILED")
            return False

        # Step 2: Frontend Server Check
        log_step(2, "Checking Frontend Vite Server")
        try:
            f_res = await client.get(FRONTEND_URL)
            assert f_res.status_code == 200
            log_step(2, "Checking Frontend Vite Server", "PASSED")
        except Exception as e:
            log_step(2, f"Frontend Server Failed: {e}", "FAILED")
            return False

        # Step 3: Register Anonymous Farm
        log_step(3, "Registering Anonymous Farm (Zero-PII)")
        try:
            farm_payload = {
                "name": "", # Nameless farm
                "crop_type": "wheat",
                "sowing_date": "2024-11-01",
                "policy_id": "POLICY-001",
                "polygon_coordinates": [
                    [30.3410, 76.3855],
                    [30.3410, 76.3883],
                    [30.3386, 76.3883],
                    [30.3386, 76.3855]
                ]
            }
            res_farm = await client.post(f"{BASE_URL}/api/farms", json=farm_payload)
            assert res_farm.status_code == 200, f"Farm creation failed: {res_farm.text}"
            farm_data = res_farm.json()
            farm_id = farm_data["id"]
            commitment = farm_data["commitment_hash"]
            assert "Anonymous Farm" in farm_data["name"]
            assert len(commitment) == 64
            print(f"    + Created Farm: {farm_data['name']}")
            print(f"    + Farm ID: {farm_id}")
            print(f"    + SHA-256 Commitment: {commitment}")
            log_step(3, "Registering Anonymous Farm (Zero-PII)", "PASSED")
        except Exception as e:
            log_step(3, f"Farm Registration Failed: {e}", "FAILED")
            return False

        # Step 4: Run Multi-Spectral Satellite & ML Analysis Pipeline
        log_step(4, "Executing Full Multi-Spectral & AI Risk Pipeline")
        try:
            res_analysis = await client.post(f"{BASE_URL}/api/farms/{farm_id}/analyze")
            assert res_analysis.status_code == 200, f"Analysis failed: {res_analysis.text}"
            analysis_info = res_analysis.json()
            assert analysis_info["status"] == "complete"
            
            # Fetch detailed analysis
            res_detail = await client.get(f"{BASE_URL}/api/farms/{farm_id}/analysis")
            assert res_detail.status_code == 200
            detail = res_detail.json()
            
            print(f"    + Sentinel-2 / PlanetScope Baseline NDVI: {detail['ndvi_baseline']:.2f}")
            print(f"    + Current NDVI: {detail['ndvi_current']:.2f} (Drop: {detail['ndvi_drop_pct']:.1f}%)")
            print(f"    + Rainfall Anomaly: {detail['rainfall_anomaly_pct']:.1f}%, Drought Risk: {detail['drought_risk']:.2f}")
            print(f"    + XGBoost Yield Loss Prediction: {detail['expected_loss_pct']:.1f}%")
            print(f"    + Composite Risk Score: {detail['risk_score']:.1f}/100 ({detail['risk_category']})")
            log_step(4, "Executing Full Multi-Spectral & AI Risk Pipeline", "PASSED")
        except Exception as e:
            log_step(4, f"Analysis Pipeline Failed: {e}", "FAILED")
            return False

        # Step 5: Generate Zero-Knowledge Eligibility Proof
        log_step(5, "Generating Groth16 Zero-Knowledge Proof (Circom/SnarkJS)")
        try:
            res_claim = await client.post(f"{BASE_URL}/api/claims", json={"farm_id": farm_id})
            assert res_claim.status_code == 200, f"Claim generation failed: {res_claim.text}"
            claim_data = res_claim.json()
            claim_id = claim_data["claim_id"]
            zk_hash = claim_data["zk_proof_hash"]
            block_hash = claim_data["block_hash"]
            print(f"    + Claim Generated: {claim_id}")
            print(f"    + Eligibility Result: {'ELIGIBLE' if claim_data['eligible'] else 'INELIGIBLE'}")
            print(f"    + ZK Proof Hash (Private Inputs Hidden): {zk_hash[:32]}...")
            print(f"    + Mined Block Hash: {block_hash[:32]}... (Block #{claim_data['block_index']})")
            log_step(5, "Generating Groth16 Zero-Knowledge Proof (Circom/SnarkJS)", "PASSED")
        except Exception as e:
            log_step(5, f"ZK Proof Generation Failed: {e}", "FAILED")
            return False

        # Step 6: Verify ZK Proof & Claim Cryptographically
        log_step(6, "Cryptographic Claim & ZK Proof Verification")
        try:
            res_verify = await client.post(f"{BASE_URL}/api/claims/{claim_id}/verify")
            assert res_verify.status_code == 200
            v_report = res_verify.json()
            assert v_report["zk_proof_valid"] is True
            assert v_report["ledger_valid"] is True
            assert v_report["overall_valid"] is True
            print(f"    + ZK Proof Valid: {v_report['zk_proof_valid']}")
            print(f"    + Ledger Block Link Valid: {v_report['ledger_valid']}")
            print(f"    + Final Status: VERIFIED & IMMUTABLE")
            log_step(6, "Cryptographic Claim & ZK Proof Verification", "PASSED")
        except Exception as e:
            log_step(6, f"Claim Verification Failed: {e}", "FAILED")
            return False

        # Step 7: Verify Entire Blockchain Ledger Integrity
        log_step(7, "Verifying Immutable SHA-256 Ledger Chain")
        try:
            res_ledger = await client.get(f"{BASE_URL}/api/ledger/verify")
            assert res_ledger.status_code == 200
            chain_status = res_ledger.json()
            assert chain_status["valid"] is True
            assert chain_status["block_count"] >= 1
            print(f"    + Total Blocks Mined: {chain_status['block_count']}")
            print(f"    + Chain Broken At: {chain_status['broken_at']} (None = Intact)")
            log_step(7, "Verifying Immutable SHA-256 Ledger Chain", "PASSED")
        except Exception as e:
            log_step(7, f"Ledger Integrity Failed: {e}", "FAILED")
            return False

    print("\n" + "="*65)
    print(" ALL 7 SMOKE TEST SUITES PASSED -- 100% OPERATIONAL")
    print("="*65 + "\n")
    return True

if __name__ == "__main__":
    success = asyncio.run(run_smoke_test())
    sys.exit(0 if success else 1)
