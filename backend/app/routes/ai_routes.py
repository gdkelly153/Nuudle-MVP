from flask import Blueprint, request, jsonify
from app.services.ai_service import ai_service_instance, run_async
import logging

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/ai/validate-problem', methods=['POST'])
def validate_problem():
    try:
        data = request.get_json()
        problem_statement = data.get('problemStatement', '')
        
        if not problem_statement.strip():
            return jsonify({
                'success': False,
                'error': 'Problem statement cannot be empty'
            }), 400
        
        # Use AI-powered validation
        result = run_async(ai_service_instance.validate_problem(problem_statement))
        
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"Problem validation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Validation failed: {str(e)}'
        }), 500

@ai_bp.route('/ai/analyze-self-awareness', methods=['POST'])
def analyze_self_awareness():
    try:
        data = request.get_json()
        causes = data.get('causes', [])
        
        if not causes:
            return jsonify({
                'success': True,
                'selfAwarenessDetected': False
            })
        
        # Use AI-powered self-awareness analysis
        result = run_async(ai_service_instance.analyze_user_self_awareness(causes))
        
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"Self-awareness analysis error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Self-awareness analysis failed: {str(e)}'
        }), 500

@ai_bp.route('/ai/adaptive-cause-analysis', methods=['POST'])
def adaptive_cause_analysis():
    """
    New endpoint for adaptive root cause analysis using the Root Cause Litmus Test
    """
    try:
        data = request.get_json()
        cause = data.get('cause', '')
        history = data.get('history', [])
        pain_point = data.get('painPoint', '')
        regenerate = data.get('regenerate', False)
        
        if not cause.strip():
            return jsonify({
                'success': False,
                'error': 'Cause cannot be empty'
            }), 400
        
        # Use the adaptive cause analysis service
        result = run_async(ai_service_instance.get_next_cause_question(
            cause=cause,
            history=history,
            pain_point=pain_point,
            regenerate=regenerate
        ))
        
        return jsonify({
            'success': True,
            **result  # Spread the result which contains either next_question or root_cause_options
        })
        
    except Exception as e:
        logging.error(f"Adaptive cause analysis error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Adaptive cause analysis failed: {str(e)}'
        }), 500

@ai_bp.route('/ai/evaluate-cause-depth', methods=['POST'])
def evaluate_cause_depth():
    """
    Endpoint to evaluate how close a cause is to being a true root cause
    """
    try:
        data = request.get_json()
        cause_text = data.get('causeText', '')
        user_response = data.get('userResponse')
        
        if not cause_text.strip():
            return jsonify({
                'success': False,
                'error': 'Cause text cannot be empty'
            }), 400
        
        # Evaluate the depth of the cause
        result = run_async(ai_service_instance.evaluate_cause_depth(
            cause_text=cause_text,
            user_response=user_response
        ))
        
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"Cause depth evaluation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Cause depth evaluation failed: {str(e)}'
        }), 500

@ai_bp.route('/ai/plan-action', methods=['POST'])
def plan_action():
    try:
        data = request.get_json()
        cause = data.get('cause', '')
        is_contribution = data.get('isContribution', False)
        user_responses = data.get('userResponses', [])
        
        if not cause.strip():
            return jsonify({
                'success': False,
                'error': 'Cause cannot be empty'
            }), 400
        
        # Use AI service to generate action options
        action_options = run_async(ai_service_instance.generate_action_options(
            cause=cause,
            is_contribution=is_contribution,
            user_responses=user_responses
        ))
        
        return jsonify({
            'success': True,
            'actionOptions': action_options
        })
        
    except Exception as e:
        logging.error(f"Action planning error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Action planning failed: {str(e)}'
        }), 500

@ai_bp.route('/ai/refine-action', methods=['POST'])
def refine_action():
    try:
        data = request.get_json()
        initial_action = data.get('initialAction', '')
        cause = data.get('cause', '')
        user_feedback = data.get('userFeedback', '')
        
        if not initial_action.strip() or not cause.strip():
            return jsonify({
                'success': False,
                'error': 'Action and cause are required'
            }), 400
        
        # Use AI service to refine the action
        refined_action = run_async(ai_service_instance.refine_action(
            initial_action=initial_action,
            cause=cause,
            user_feedback=user_feedback
        ))
        
        return jsonify({
            'success': True,
            'refinedAction': refined_action
        })
        
    except Exception as e:
        logging.error(f"Action refinement error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Action refinement failed: {str(e)}'
        }), 500