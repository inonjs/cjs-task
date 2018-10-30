module.exports = TaskManager;

function TaskManager(callback){

  var current_step = 0,
      step_order = [],
      store = {},
      log = [],
      api = {},
      steps_run = 0,
      steps_deleted = 0,
      insertions = 0,
      started;

  if(!callback){ callback = function(){} }
  if(typeof callback !== 'function'){ throw new Error('TASK CALLBACK MUST BE A FUNCTION'); }
  
  // stats
    api.stats = {
      steps_run: function(){ return steps_run },
      steps_deleted: function(){ return steps_deleted }
    };
  
  // control flow
    api.start = start_task;
    api.step = create_task_step;
    api.next = run_next_task_step;
    api.end = end_task;

  // configuration
    api.get = get_task_variable;
    api.set = set_task_variable;
    api.unset = delete_task_varable;
    api.callback = set_task_callback;

  // logging
    api.log = function( entry ){
      if(entry) create_task_log_entry(entry);
      else return get_task_log();
    };

  return api;
  
  function set_task_callback(end_callback){

    if(typeof end_callback !== 'function'){ throw new Error('TASK CALLBACK MUST BE A FUNCTION'); }

    callback = end_callback;
  }

  function create_task_step(name, step){

    if(!name){ throw new Error('TASKS CAN\'T HAVE UNNAMED STEPS'); }
    if(typeof name !== 'string'){ throw new Error('STEP NAMES MUST BE STRINGS'); }
    if(!step || typeof step !== "function"){ throw new Error('TASK STEPS ARE FUNCTIONS'); }
    
    if( !started ) step_order.push({ name: name, step: step });

    else {

      step_order.splice( current_step + 1 + insertions, 0, { name: name, step: step });
      insertions += 1;
    }
  }

  function start_task(){

    if( started ) throw new Error('TASK HAS ALREADY STARTED');
    if( step_order.length < 1 ) throw new Error('TASK HAS NO STEPS TO RUN');

    started = true;

    setTimeout( step_order[0].step, 0 );
  }

  function run_next_task_step(){

    if( !started ) throw new Error('CAN\'T CALL NEXT STEP BEFORE TASK STARTS');

    steps_run += 1;

    // remove previously completed step
      step_order.shift();
      steps_deleted += 1;
      insertions = 0;

    // end task if no more steps remain
      var should_end_task = step_order.length === 0;
      if( should_end_task ) return api.end();

    setTimeout( step_order[ current_step ].step, 0 );
  }

  function end_task(){

    if( !started ) throw new Error('CAN\'T CALL NEXT STEP BEFORE TASK STARTS');
    
    callback.apply(callback, arguments);
    store = noticeboard = log = api = null;
  }

  function delete_task_varable(key){

    if(!key){ throw new Error('NEED A KEY TO DELETE DATA'); }
    if(typeof key !== 'string'){ throw new Error('KEY MUST BE A STRING'); }

    delete store[key];
  }

  function set_task_variable(key, value){

    if(!key){ throw new Error('NEED A KEY TO STORE DATA'); }
    if(typeof value === 'undefined'){ throw new Error('NEED A VALUE TO STORE'); }
    if(typeof key !== 'string'){ throw new Error('KEY MUST BE A STRING'); }

    store[key] = value;
  }

  function get_task_variable(key){

    if(!key){ throw new Error('NEED A KEY TO RETRIEVE DATA'); }
    if(typeof key !== 'string'){ throw new Error('KEY MUST BE A STRING'); }

    return (typeof store[key] !== 'undefined' ? store[key] : null);
  }

  function create_task_log_entry(entry){
    log.push(entry);
  }

  function get_task_log(){
    return log;
  }
}